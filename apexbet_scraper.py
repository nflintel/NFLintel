# =========================================================
#  APEXBET TOTAL SCRAPER — ULTRA+ EDITION (ONE GIANT FILE)
# =========================================================

import argparse
from playwright.sync_api import sync_playwright
import os, json, re, hashlib, time, sqlite3, traceback
from queue import Queue
import threading
import urllib.request
import urllib.parse

# ---------------------------------------------------------
# CONFIGURATION (Defaults, can be overridden via CLI)
# ---------------------------------------------------------

START_URL = "https://apexbet.mpwa.to/"
DOMAIN = "apexbet.mpwa.to"
WORKER_COUNT = 3
MAX_RETRIES = 5
RETRY_DELAY = 1.5
MAX_PAGES = 0  # 0 means unlimited

OUTPUT = {
    "offline": "output/offline_clone",
    "api": "output/api_dump",
    "ui": "output/ui_map",
    "assets": "output/assets",
    "dom": "output/dom_snapshots",
    "routes": "output/route_map",
    "db": "output/database"
}

DB_PATH = f"{OUTPUT['db']}/apexbet.db"
SESSION_FILE = "output/session_state.json"
REBUILD_DIR = "output/rebuild_site"
GRAPHVIZ_DIR = "output/graphviz"
ML_UI_DIR = "output/ml_ui_components"

# ---------------------------------------------------------
# UTILITIES
# ---------------------------------------------------------

def safe_name(url: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '_', url)

def ensure_dirs():
    for p in OUTPUT.values():
        os.makedirs(p, exist_ok=True)
    os.makedirs(REBUILD_DIR, exist_ok=True)
    os.makedirs(GRAPHVIZ_DIR, exist_ok=True)
    os.makedirs(ML_UI_DIR, exist_ok=True)

def hash_bytes(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()

def log(msg: str):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def push_to_vibe_coder(url, html_content):
    log("Pushing scraped data to Vibe Coder...")
    payload = {
        "name": f"Scraped: {url}",
        "html": html_content,
        "css": "",
        "js": ""
    }
    
    req = urllib.request.Request("http://localhost:3000/api/internal/import-scrape")
    req.add_header('Content-Type', 'application/json')
    try:
        response = urllib.request.urlopen(req, json.dumps(payload).encode('utf-8'))
        resp_data = json.loads(response.read().decode('utf-8'))
        log(f"Successfully pushed to Vibe Coder! Project ID: {resp_data.get('projectId')}")
    except Exception as e:
        log(f"Failed to push to Vibe Coder. Is the server running on port 3000? Error: {e}")

# ---------------------------------------------------------
# DATABASE INIT
# ---------------------------------------------------------

def init_database():
    os.makedirs(OUTPUT["db"], exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS api_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            timestamp TEXT,
            response_json TEXT
        )
    """)
    conn.commit()
    conn.close()
    log("SQLite database initialized.")


# =========================================================
#  PART 2 — API DUMP + ASSET SYSTEM
# =========================================================

def store_api_response(url: str, data: dict):
    name = safe_name(url)
    with open(f"{OUTPUT['api']}/{name}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO api_responses (url, timestamp, response_json) VALUES (?, datetime('now'), ?)",
        (url, json.dumps(data))
    )
    conn.commit()
    conn.close()

def enable_api_dump(page):
    @page.on("response")
    def handle_response(response):
        url = response.url
        if "api" in url:
            try:
                data = response.json()
                store_api_response(url, data)
                log(f"API captured: {url}")
            except:
                pass

ASSET_HASHES = set()

def save_asset(url: str, content: bytes):
    h = hash_bytes(content)
    if h in ASSET_HASHES:
        return
    ASSET_HASHES.add(h)

    filename = safe_name(url)
    with open(f"{OUTPUT['assets']}/{filename}", "wb") as f:
        f.write(content)
    log(f"Asset saved: {filename}")

def enable_asset_download(page):
    @page.on("response")
    def save_assets(response):
        url = response.url
        if any(url.endswith(ext) for ext in [
            ".png", ".jpg", ".jpeg", ".svg", ".gif",
            ".css", ".js", ".webp", ".ico"
        ]):
            try:
                content = response.body()
                save_asset(url, content)
            except:
                pass


# =========================================================
#  PART 3 — OFFLINE CLONE + UI + DOM SNAPSHOTS
# =========================================================

def save_offline(page, route):
    html = page.content()
    name = safe_name(route)
    path = f"{OUTPUT['offline']}/{name}.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    log(f"Offline HTML saved: {path}")
    return html

def save_ui(page, route):
    name = safe_name(route)
    path = f"{OUTPUT['ui']}/{name}.png"
    page.screenshot(path=path, full_page=True)
    log(f"UI screenshot saved: {path}")

def save_dom(page, route):
    html = page.content()
    name = safe_name(route)
    path = f"{OUTPUT['dom']}/{name}.html"
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    log(f"DOM snapshot saved: {path}")


# =========================================================
#  PART 4 — ROUTE DISCOVERY + INFINITE SCROLL
# =========================================================

def discover_routes(page):
    try:
        links = page.eval_on_selector_all("a", "els => els.map(e => e.href)")
    except:
        links = []

    internal = [l for l in links if DOMAIN in l]

    route_file = f"{OUTPUT['routes']}/routes.json"
    with open(route_file, "w", encoding="utf-8") as f:
        json.dump(internal, f, indent=2)

    log(f"Discovered {len(internal)} internal routes.")
    return internal

def auto_scroll(page, max_scrolls=20, delay=0.2):
    try:
        for _ in range(max_scrolls):
            page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
            time.sleep(delay)
    except Exception as e:
        log(f"Infinite scroll error: {e}")


# =========================================================
#  PART 5 — SESSION PERSISTENCE
# =========================================================

def save_session(page):
    try:
        state = {
            "cookies": page.context.cookies(),
            "localStorage": page.evaluate("() => Object.assign({}, window.localStorage)")
        }
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        log("Session saved.")
    except Exception as e:
        log(f"Failed to save session: {e}")

def load_session(context):
    if not os.path.exists(SESSION_FILE):
        return
    try:
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            state = json.load(f)

        context.add_cookies(state.get("cookies", []))

        temp_page = context.new_page()
        temp_page.goto(START_URL, wait_until="domcontentloaded")
        for k, v in state.get("localStorage", {}).items():
            temp_page.evaluate(f"localStorage.setItem('{k}', '{v}')")
        temp_page.close()

        log("Session loaded.")
    except Exception as e:
        log(f"Failed to load session: {e}")


# =========================================================
#  PART 6 — CRAWL ENGINE
# =========================================================

CRAWL_QUEUE = Queue()
VISITED = set()

def fetch_with_retry(page, url):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            log(f"Loading [{attempt}/{MAX_RETRIES}]: {url}")
            page.goto(url, wait_until="networkidle", timeout=45000)
            return True
        except Exception as e:
            log(f"Error loading {url}: {e}")
            time.sleep(RETRY_DELAY * attempt)
    log(f"FAILED to load after retries: {url}")
    return False

def crawl_route(page, url, ml_extract=False, vibe_push=False):
    global VISITED
    if url in VISITED:
        return
    
    if MAX_PAGES > 0 and len(VISITED) >= MAX_PAGES:
        log(f"Reached MAX_PAGES limit ({MAX_PAGES}). Stopping crawl.")
        return

    VISITED.add(url)

    log(f"--- Crawling: {url} ---")

    if not fetch_with_retry(page, url):
        return

    auto_scroll(page)

    html_content = save_offline(page, url)
    save_ui(page, url)
    save_dom(page, url)
    
    if ml_extract:
        extract_ui_components(page, url)
        
    if vibe_push:
        push_to_vibe_coder(url, html_content)

    new_routes = discover_routes(page)
    for r in new_routes:
        if r not in VISITED:
            CRAWL_QUEUE.put(r)

    save_session(page)

def run_crawler(page, ml_extract=False, vibe_push=False):
    CRAWL_QUEUE.put(START_URL)
    while not CRAWL_QUEUE.empty():
        url = CRAWL_QUEUE.get()
        try:
            crawl_route(page, url, ml_extract=ml_extract, vibe_push=vibe_push)
        except Exception as e:
            log(f"CRAWL ERROR on {url}: {e}")
            traceback.print_exc()
            continue
    log("Crawl complete.")


# =========================================================
#  PART 7 — BROWSER CLUSTER
# =========================================================

def worker_thread(worker_id, playwright, headless=True, ml_extract=False, vibe_push=False):
    log(f"[Worker {worker_id}] Starting browser instance...")

    browser = playwright.chromium.launch(headless=headless)
    context = browser.new_context()

    load_session(context)

    page = context.new_page()
    enable_api_dump(page)
    enable_asset_download(page)

    while not CRAWL_QUEUE.empty():
        try:
            url = CRAWL_QUEUE.get_nowait()
        except:
            break

        try:
            log(f"[Worker {worker_id}] Crawling: {url}")
            crawl_route(page, url, ml_extract=ml_extract, vibe_push=vibe_push)
        except Exception as e:
            log(f"[Worker {worker_id}] ERROR on {url}: {e}")
            traceback.print_exc()

    save_session(page)
    browser.close()
    log(f"[Worker {worker_id}] Finished.")

def run_cluster(headless=True, ml_extract=False, vibe_push=False):
    log("Starting browser cluster...")
    with sync_playwright() as p:
        threads = []
        for i in range(WORKER_COUNT):
            t = threading.Thread(target=worker_thread, args=(i + 1, p, headless, ml_extract, vibe_push))
            t.start()
            threads.append(t)
        for t in threads:
            t.join()
    log("Cluster crawl complete.")


# =========================================================
#  PART 8 — SQLITE BACKEND + API REPLAY
# =========================================================

def db_connect():
    return sqlite3.connect(DB_PATH)

def db_get_all_api():
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("SELECT url, timestamp, response_json FROM api_responses")
    rows = cur.fetchall()
    conn.close()
    return rows

def db_get_api_by_url(url):
    conn = db_connect()
    cur = conn.cursor()
    cur.execute("""
        SELECT response_json
        FROM api_responses
        WHERE url = ?
        ORDER BY id DESC
        LIMIT 1
    """, (url,))
    row = cur.fetchone()
    conn.close()
    return json.loads(row[0]) if row else None

def replay_api(url):
    data = db_get_api_by_url(url)
    if data is None:
        log(f"No stored API response for: {url}")
        return None
    log(f"Replaying API: {url}")
    return data

def export_api_dump():
    rows = db_get_all_api()
    export_path = f"{OUTPUT['api']}/_ALL_API_DATA.json"
    export_data = [
        {"url": url, "timestamp": ts, "data": json.loads(resp)}
        for url, ts, resp in rows
    ]
    with open(export_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2)
    log(f"Exported full API dataset: {export_path}")


# =========================================================
#  PART 9 — SITE REBUILD
# =========================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>
        body {{
            background: #111;
            color: #eee;
            font-family: Arial, sans-serif;
            padding: 20px;
        }}
        .container {{
            max-width: 900px;
            margin: auto;
        }}
        h1 {{
            color: #00eaff;
        }}
        pre {{
            background: #222;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{title}</h1>
        <p><strong>Original URL:</strong> {url}</p>
        <h2>Stored API Data</h2>
        <pre>{api_json}</pre>
        <h2>Offline HTML Snapshot</h2>
        <pre>{html_preview}</pre>
    </div>
</body>
</html>
"""

def rebuild_page(url):
    name = safe_name(url)
    html_path = f"{OUTPUT['offline']}/{name}.html"
    if not os.path.exists(html_path):
        log(f"Cannot rebuild (no HTML snapshot): {url}")
        return

    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    api_data = db_get_api_by_url(url)
    api_json = json.dumps(api_data, indent=2) if api_data else "No API data stored."

    html_preview = html_content[:2000] + "\n...\n[truncated]" if len(html_content) > 2000 else html_content

    rendered = HTML_TEMPLATE.format(
        title=f"Rebuilt Page — {url}",
        url=url,
        api_json=api_json,
        html_preview=html_preview
    )

    out_path = f"{REBUILD_DIR}/{name}.html"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(rendered)

    log(f"Rebuilt page saved: {out_path}")

def rebuild_entire_site():
    html_files = os.listdir(OUTPUT["offline"])
    urls = []
    for filename in html_files:
        if filename.endswith(".html"):
            url = filename.replace("_", "/")
            urls.append(url)

    log(f"Rebuilding {len(urls)} pages...")
    for url in urls:
        try:
            rebuild_page(url)
        except Exception as e:
            log(f"Rebuild error for {url}: {e}")
    log("Full site rebuild complete.")


# =========================================================
#  PART 10 — GRAPHVIZ EXPORT
# =========================================================

def export_route_graph():
    route_file = f"{OUTPUT['routes']}/routes.json"
    if not os.path.exists(route_file):
        log("No routes.json found — cannot generate graph.")
        return

    with open(route_file, "r", encoding="utf-8") as f:
        routes = json.load(f)

    dot_path = f"{GRAPHVIZ_DIR}/route_map.dot"

    with open(dot_path, "w", encoding="utf-8") as f:
        f.write("digraph ApexBetRoutes {\n")
        f.write("  rankdir=LR;\n")
        f.write("  node [shape=box, style=filled, color=\"#00eaff\", fillcolor=\"#001f2b\", fontcolor=\"#ffffff\"];\n\n")

        for url in routes:
            src = safe_name(START_URL)
            dst = safe_name(url)
            f.write(f"  \"{src}\" -> \"{dst}\";\n")

        f.write("}\n")

    log(f"Graphviz route map exported: {dot_path}")


# =========================================================
#  PART 11 — ML UI COMPONENT EXTRACTION
# =========================================================

def extract_ui_components(page, route):
    name = safe_name(route)

    selectors = {
        "buttons": "button",
        "images": "img",
        "inputs": "input",
        "cards": "div[class*='card'], div[class*='Card'], div[class*='tile'], div[class*='Tile']",
        "links": "a",
        "text_blocks": "p, span, h1, h2, h3, h4, h5, h6"
    }

    component_index = 0
    results = []

    for comp_type, selector in selectors.items():
        try:
            elements = page.query_selector_all(selector)
        except:
            elements = []

        for el in elements:
            try:
                box = el.bounding_box()
                if not box:
                    continue

                component_index += 1
                comp_id = f"{name}_{comp_type}_{component_index}"

                screenshot_path = f"{ML_UI_DIR}/{comp_id}.png"
                el.screenshot(path=screenshot_path)

                try:
                    text = el.inner_text()
                except:
                    text = ""

                attrs = page.evaluate(
                    """(el) => {
                        const out = {};
                        for (let attr of el.attributes) {
                            out[attr.name] = attr.value;
                        }
                        return out;
                    }""",
                    el
                )

                metadata = {
                    "id": comp_id,
                    "type": comp_type,
                    "route": route,
                    "text": text,
                    "attributes": attrs,
                    "bounding_box": box,
                    "screenshot": screenshot_path
                }

                results.append(metadata)

            except Exception as e:
                log(f"UI extraction error: {e}")

    meta_path = f"{ML_UI_DIR}/{name}_components.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    log(f"Extracted {len(results)} UI components for ML: {meta_path}")


# =========================================================
#  PART 12 — MAIN ORCHESTRATOR
# =========================================================

def main(cluster=True, rebuild=False, graph=False, ml_extract=False, headless=True, vibe_push=False):
    log("Initializing ApexBet ULTRA+ Scraper...")

    ensure_dirs()
    init_database()

    with sync_playwright() as p:
        if not cluster:
            log("Running in single-browser mode...")
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context()
            load_session(context)
            page = context.new_page()
            enable_api_dump(page)
            enable_asset_download(page)
            run_crawler(page, ml_extract=ml_extract, vibe_push=vibe_push)
            save_session(page)
            browser.close()
        else:
            log("Running in CLUSTER MODE...")
            CRAWL_QUEUE.put(START_URL)
            run_cluster(headless=headless, ml_extract=ml_extract, vibe_push=vibe_push)

    if rebuild:
        log("Rebuilding static site...")
        rebuild_entire_site()

    if graph:
        log("Exporting Graphviz route map...")
        export_route_graph()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ApexBet ULTRA+ Scraper")
    parser.add_argument("--url", default="https://apexbet.mpwa.to/", help="Target URL to scrape")
    parser.add_argument("--domain", default="apexbet.mpwa.to", help="Domain to restrict crawling")
    parser.add_argument("--workers", type=int, default=3, help="Number of concurrent workers")
    parser.add_argument("--retries", type=int, default=5, help="Max retries per page")
    parser.add_argument("--max-pages", type=int, default=0, help="Max pages to scrape (0 = unlimited)")
    parser.add_argument("--out-dir", default="output", help="Base output directory")
    
    # Feature flags
    parser.add_argument("--no-cluster", action="store_true", help="Run in single-browser mode instead of cluster")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild static site after crawl")
    parser.add_argument("--graph", action="store_true", help="Export Graphviz route map")
    parser.add_argument("--ml-extract", action="store_true", help="Extract UI components for ML")
    parser.add_argument("--headed", action="store_true", help="Run browser in headed mode (visible)")
    parser.add_argument("--vibe", action="store_true", help="Automatically push scraped data to the local Vibe Coder server")
    
    args = parser.parse_args()

    # Update globals based on CLI args
    START_URL = args.url
    DOMAIN = args.domain
    WORKER_COUNT = args.workers
    MAX_RETRIES = args.retries
    MAX_PAGES = args.max_pages

    # Update paths based on out-dir
    OUTPUT = {
        "offline": f"{args.out_dir}/offline_clone",
        "api": f"{args.out_dir}/api_dump",
        "ui": f"{args.out_dir}/ui_map",
        "assets": f"{args.out_dir}/assets",
        "dom": f"{args.out_dir}/dom_snapshots",
        "routes": f"{args.out_dir}/route_map",
        "db": f"{args.out_dir}/database"
    }
    DB_PATH = f"{OUTPUT['db']}/apexbet.db"
    SESSION_FILE = f"{args.out_dir}/session_state.json"
    REBUILD_DIR = f"{args.out_dir}/rebuild_site"
    GRAPHVIZ_DIR = f"{args.out_dir}/graphviz"
    ML_UI_DIR = f"{args.out_dir}/ml_ui_components"

    main(
        cluster=not args.no_cluster,
        rebuild=args.rebuild,
        graph=args.graph,
        ml_extract=args.ml_extract,
        headless=not args.headed,
        vibe_push=args.vibe
    )
