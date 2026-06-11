<div align="center">
  <h1>KRISHNA — Privacy‑First AI Financial Copilot</h1>
  <p><em>Self‑Correcting Multi‑Agent Architecture • Demo‑ready Streamlit prototype</em></p>

  <!-- Badges -->
  <p>
    <img alt="Python" src="https://img.shields.io/badge/python-3.10%2B-blue" />
    <img alt="Streamlit" src="https://img.shields.io/badge/streamlit-ready-brightgreen" />
    <img alt="License" src="https://img.shields.io/badge/license-MIT-lightgrey" />
  </p>

  <!-- Screenshot placeholder (replace with actual image for demos) -->
  <img width="1894" height="907" alt="image" src="https://github.com/user-attachments/assets/22e1bf89-5e88-40b2-8e9c-891abbf66962" />

  <p>
   
  </p>
</div>

## Table of Contents

- [Overview](#overview)
- [Highlights](#highlights)
- [Quick Start (Local Demo)](#quick-start-local-demo)
- [Using the App](#using-the-app)
- [Auditor & Self‑Correction](#auditor--self-correction)
- [Golden Dataset & Evaluation](#golden-dataset--evaluation)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [License](#license)

## Overview

KRISHNA is a privacy‑focused, demo‑ready prototype that demonstrates a self‑correcting multi‑agent workflow for personal finance analysis. The system ingests transaction CSVs, sanitizes PII, categorizes transactions into a fixed set of 10 categories, drafts personalized budgets, validates recommendations with an Auditor agent, and generates human‑friendly explanations — all locally via a Streamlit UI.

Key goals:

- Multi‑Agent collaboration (Privacy → Bookkeeper → Advisor → Auditor → Explainability)
- Self‑correction loop with transparent auditing and revision
- Strong privacy guarantees (local PII masking without external transmission by default)
- Works without OpenAI API keys using deterministic fallbacks

## Highlights

- PII masking: emails, phones, UPI handles, and long numeric IDs are sanitized before analysis.
- Fixed 10-category taxonomy ensures consistent classification.
- Auditor enforces budget realism and mathematical consistency and drives automated advisor revisions.
- Demo Mode forces an Auditor rejection to showcase the correction loop.

## Project Structure

Top-level files and folders:

- `app.py` — Streamlit entrypoint and orchestrator
- `agents/` — modular agent implementations (`privacy`, `bookkeeper`, `advisor`, `auditor`, `explainability`)
- `utils/` — helper utilities (sample data, privacy helpers, metrics)
- `data/` — `sample_transactions.csv`, `golden_dataset.csv` (≥100 transactions)
- `requirements.txt` — Python dependencies
- `.env.example` — environment variables (optional OpenAI key)

## Quick Start (Local Demo)

Prerequisites: Python 3.10+ and `pip`.

1. Create a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. (Optional) Copy the example env and add an `OPENAI_API_KEY` if you want LLM-enhanced outputs. The app runs without it.

```bash
cp .env.example .env
# Edit .env to add OPENAI_API_KEY if available
```

4. Run the Streamlit app:

```bash
streamlit run app.py
```

Then open the URL shown by Streamlit (usually http://localhost:8501).

## Using the App

Sidebar controls:

- Upload CSV (columns: `date`, `description`, `amount`) or click `Load Sample CSV`.
- Enter `Monthly Income` (required).
- `Savings Goal` slider (default 20%).
- `Demo Mode` toggle — when enabled, the first Advisor draft will be rejected to demonstrate the self‑correction loop.
- `Run Analysis` button — executes the full agent pipeline.

Main tabs:

1. Data & Privacy — raw vs sanitized data, PII masking counts.
2. Dashboard — KPIs, expense charts, budget vs actual, alerts.
3. Recommendations & Explainability — final approved budget, savings tips, evidence, and audit report.
4. Agent Logs — chronological trace of the agent workflow and revisions.

## Auditor & Self‑Correction

The Auditor executes several checks (budget math, realism versus historical spending, required tips consistency). If any check fails, it returns structured feedback to the Advisor, which revises the draft. This loop repeats up to 3 attempts (configurable). All steps and decisions are visible in the Agent Logs tab for transparency during demos.

## Golden Dataset & Evaluation

The repository includes a `golden_dataset.csv` (≥100 labeled transactions) to compute categorization metrics such as accuracy, precision, and recall. These metrics are displayed in the Dashboard to showcase model quality.

## Privacy & Security

- All PII masking occurs locally before other processing.
- By default the app does not send data to external services. Enabling `OPENAI_API_KEY` is optional and clearly documented.

## Development Notes

- Agents are modular and can be replaced with remote models or improved heuristics.
- Robust fallbacks ensure the app never crashes without API keys.

## Troubleshooting

- Streamlit not launching: ensure Python v3.10+ and dependencies are installed.
- Missing data: use the `Load Sample CSV` button in the sidebar.
- OpenAI errors: remove the `OPENAI_API_KEY` from `.env` to use fallbacks.

## Contributing

Contributions are welcome. Suggested improvements:

- Expand the golden dataset coverage
- Improve categorization heuristics and regex coverage for PII
- Localize currency/formatting

## License

MIT

---

