# Pulse-Intel

A Selenium-based multi-source news and market scraper project.

The project currently scrapes news and market data from multiple sources, with source-specific scrapers organized under the `scripts/` folder.

## Current Scope

Implemented scrapers:

- `World Monitor`
- `Yahoo Finance`
- `Gold/Oil price website`

It collects structured data such as:

- AI Insights
- Intel Feed
- Regional news sections
- Topic-based sections like energy, government, and think tanks

## Implemented Sources

The project uses a small collection of source-specific scrapers under `scripts/`.

Implemented sources:

- `Yahoo Finance`
- `Gold/Oil price website`

These sources live alongside the current `World Monitor` scraper as part of the broader multi-source scraping setup.

## Project Structure

```text
news-scapper/
├── main.py
├── README.md
├── requirements.txt
├── scripts/
│   ├── scrapper.py
│   ├── wms.py
│   ├── yahoo finance scraper
│   └── gold/oil price scraper
└── utils/
    ├── constants.py
    ├── dates.py
    ├── folders.py
    └── sessions.py
```

## Current Data Sources

### World Monitor

Website:

- [https://www.worldmonitor.app/](https://www.worldmonitor.app/)

### Yahoo Finance

Implemented as part of the project source set for market-focused scraping.

### Gold/Oil Price Website

Implemented as part of the project source set for commodity price scraping.

World Monitor currently implemented sections include:

- `ai_insights`
- `intel_feed`
- `world_news`
- `united_states`
- `europe`
- `middle_east`
- `africa`
- `latin_america`
- `asia_pacific`
- `energy_and_resources`
- `government`
- `think_tanks`

Additional section IDs already exist in `utils/constants.py` for future expansion, including:

- `economic_indicators`
- `trade_policy`
- `supply_chain`
- `financial`
- `technology`
- `crypto`
- `ai_ml`

## How It Works

The current flow is:

1. Read configuration from `utils/constants.py`
2. Create an output folder for the current day
3. Start a Microsoft Edge Selenium session
4. Open World Monitor
5. Scrape selected sections
6. Return the scraped result as a nested Python dictionary
7. Export a normalized Excel workbook to the daily output folder

## Requirements

- Python 3.10+
- Microsoft Edge installed
- Matching Microsoft Edge WebDriver
- `selenium`
- `openpyxl`

Install dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

The main configuration lives in `utils/constants.py`.

Important settings:

- `website`
- `webdriver_path`
- `wms_ids`
- `output_folder`

Example:

```python
website = "https://www.worldmonitor.app/"
webdriver_path = "./edgedriver_145/msedgedriver.exe"
output_folder = "./output_news/"
```

Make sure your Edge WebDriver version matches your installed Edge browser version.

Next, environment variables:

1. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Configure environmental variables:
   - `MONGO_URI`: Production cluster URI (retains min 10 records).
   - `MONGO_WEEKLY_URI`: Weekly historical cluster URI (retains min 60 records).
   - `GMAIL_SMTP_USER`, `GMAIL_APP_PASSWORD`, `GMAIL_NOTIFY_TO`: SMTP credentials for email log delivery.

## Execution

- **Run Scraper**:
  ```bash
  python main.py
  ```

- **Run Worker (Sync & Data Retention)**:
  ```bash
  python worker.py
  ```
  `worker.py` copies daily scraped documents to the weekly cluster without duplicates, then prunes the oldest records in production (min 10 kept) and weekly history (min 60 kept).

- **Automated Workflow**:
  Triggered daily at 03:00 UTC via GitHub Actions (`.github/workflows/daily_worker.yml`).


## Output

The current script exports an Excel workbook to `output_news/<YYYYMMDD>/` with:

- `overview` summary sheet
- `geo_insights` and `breaking_news` sheets
- `feeds_all` sheet across all sections
- one sheet per section (`intel_feed`, `world_news`, etc.)

The nested dictionary shape is still used internally and includes keys like:

Typical top-level output keys include:

- `ai_insights`
- `intel_feed`
- `world_news`
- `united_states`
- `europe`
- `middle_east`
- `africa`
- `latin_america`
- `asia_pacific`
- `energy_and_resources`
- `government`
- `think_tanks`

Example shape:

```python
{
    "ai_insights": {
        "world_brief": "...",
        "geo_insights": [...],
        "break_news": [...]
    },
    "intel_feed": {
        "Headline": {
            "href": "https://example.com",
            "time": "5 hours ago"
        }
    }
}
```

## Notes

- The current implementation uses Selenium with Edge in headless mode.
- Browser log noise is reduced in `utils/sessions.py`.
- Excel export is integrated through `utils/excel_export.py`.
- The project uses a multi-source scraping approach, not just one website.

## Roadmap

Short-term goals:

- Export results to CSV
- Normalize output for easier storage
- Add SQLite support for local CRUD
- Expand market and economic data coverage

## Disclaimer

Use this project responsibly and make sure your scraping behavior respects website terms, rate limits, and local laws.
