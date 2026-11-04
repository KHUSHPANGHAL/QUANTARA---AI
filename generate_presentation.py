import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_quantara_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide

    # Color Palette (White-First Academic Financial Theme)
    BG_WHITE = RGBColor(255, 255, 255)
    BG_CARD = RGBColor(248, 250, 252)        # Slate 50
    BG_ACCENT_LIGHT = RGBColor(240, 249, 255) # Sky 50
    BORDER_LIGHT = RGBColor(226, 232, 240)    # Slate 200
    BORDER_BLUE = RGBColor(186, 230, 253)     # Sky 200

    TEXT_NAVY = RGBColor(15, 23, 42)          # Slate 900
    TEXT_MUTED = RGBColor(71, 85, 105)        # Slate 600
    TEXT_LIGHT = RGBColor(100, 116, 139)      # Slate 500
    ACCENT_BLUE = RGBColor(2, 132, 199)       # Sky 600
    ACCENT_DARK_BLUE = RGBColor(30, 58, 138)  # Blue 900
    ACCENT_GREEN = RGBColor(16, 149, 193)     # Cyan/Green 600
    GAIN_GREEN = RGBColor(16, 185, 129)       # Emerald 500
    LOSS_RED = RGBColor(239, 68, 68)          # Red 500

    FONT_FAMILY = "Segoe UI"

    def add_bg(slide):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_WHITE
        bg_shape.line.fill.background()

    def add_header(slide, slide_num, category, title, subtitle=None):
        # Category pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = BG_ACCENT_LIGHT
        pill.line.color.rgb = BORDER_BLUE
        pill.line.width = Pt(1)
        tf = pill.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"SECTION 0{slide_num} // {category.upper()}"
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE
        p.alignment = PP_ALIGN.LEFT

        # Slide Number
        num_box = slide.shapes.add_textbox(Inches(11.8), Inches(0.4), Inches(0.8), Inches(0.35))
        np = num_box.text_frame.paragraphs[0]
        np.text = f"{slide_num:02d} / 10"
        np.font.name = FONT_FAMILY
        np.font.size = Pt(11)
        np.font.bold = True
        np.font.color.rgb = TEXT_LIGHT
        np.alignment = PP_ALIGN.RIGHT

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.8), Inches(0.6))
        tp = title_box.text_frame.paragraphs[0]
        tp.text = title
        tp.font.name = FONT_FAMILY
        tp.font.size = Pt(22)
        tp.font.bold = True
        tp.font.color.rgb = TEXT_NAVY

        # Subtitle
        if subtitle:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.25), Inches(11.8), Inches(0.4))
            sp = sub_box.text_frame.paragraphs[0]
            sp.text = subtitle
            sp.font.name = FONT_FAMILY
            sp.font.size = Pt(11)
            sp.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, bg=BG_CARD, border=BORDER_LIGHT):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg
        card.line.color.rgb = border
        card.line.width = Pt(1)
        return card

    # =========================================================================
    # SLIDE 1: Title & Project Overview
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    add_bg(slide1)

    # Decorative header strip
    strip = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    strip.fill.solid()
    strip.fill.fore_color.rgb = ACCENT_BLUE
    strip.line.fill.background()

    # Category badge
    b1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.9), Inches(3.6), Inches(0.38))
    b1.fill.solid()
    b1.fill.fore_color.rgb = BG_ACCENT_LIGHT
    b1.line.color.rgb = BORDER_BLUE
    b1.line.width = Pt(1)
    p = b1.text_frame.paragraphs[0]
    p.text = "ACADEMIC CAPSTONE // QUANTITATIVE FINANCE"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    # Title
    t_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.8), Inches(1.6))
    tp1 = t_box.text_frame.paragraphs[0]
    tp1.text = "QUANTARA AI"
    tp1.font.name = FONT_FAMILY
    tp1.font.size = Pt(44)
    tp1.font.bold = True
    tp1.font.color.rgb = ACCENT_DARK_BLUE

    tp2 = t_box.text_frame.add_paragraph()
    tp2.text = "Systematic Machine Learning & Deep Learning Trend Forecasting Framework for NSE Blue-Chip Equities"
    tp2.font.name = FONT_FAMILY
    tp2.font.size = Pt(18)
    tp2.font.bold = True
    tp2.font.color.rgb = TEXT_NAVY

    # Sub-description
    desc_box = slide1.shapes.add_textbox(Inches(0.8), Inches(3.1), Inches(11.8), Inches(0.7))
    dp = desc_box.text_frame.paragraphs[0]
    dp.text = "A leak-free, walk-forward validated algorithmic framework bridging statistical machine learning, recurrent neural networks, and interactive institutional trading interfaces."
    dp.font.name = FONT_FAMILY
    dp.font.size = Pt(12)
    dp.font.color.rgb = TEXT_MUTED

    # 4 Architecture Highlights Cards
    cards_data = [
        ("DATASET & UNIVERSE", "8 Core NSE Equities", "19,776 historical sessions spanning 2016-2026 with 22-day embargoed sample splits."),
        ("ML & DL ENGINES", "Hybrid Multi-Model Ensemble", "L2-Logistic Regression, Random Forest, LightGBM, and 60-day Sequence LSTM/GRU networks."),
        ("VALIDATION RIGOR", "Purged Walk-Forward CV", "Zero lookahead leakage, cross-stock temporal boundary isolation, and realistic transaction friction."),
        ("FULL-STACK TERMINAL", "FastAPI & Next.js 14", "Real-time NSE market sync, live tick streaming, What-If simulation studio, and TradingView charting.")
    ]

    for i, (head, subhead, text) in enumerate(cards_data):
        c_left = Inches(0.8 + i * 2.98)
        card = add_card(slide1, c_left, Inches(3.9), Inches(2.85), Inches(2.2), BG_CARD, BORDER_LIGHT)
        
        tb = slide1.shapes.add_textbox(c_left + Inches(0.15), Inches(4.05), Inches(2.55), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = head
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_BLUE

        p2 = tf.add_paragraph()
        p2.text = subhead
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(12)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_NAVY
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = text
        p3.font.name = FONT_FAMILY
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(6)

    # Footer Metadata
    meta_box = slide1.shapes.add_textbox(Inches(0.8), Inches(6.4), Inches(11.8), Inches(0.5))
    mp = meta_box.text_frame.paragraphs[0]
    mp.text = "Author / Candidate: Khush Panghal  |  Discipline: Computer Science & Data Engineering  |  Academic Evaluation 2026"
    mp.font.name = FONT_FAMILY
    mp.font.size = Pt(10)
    mp.font.bold = True
    mp.font.color.rgb = TEXT_LIGHT

    slide1.notes_slide.notes_text_frame.text = (
        "Good morning, respected examiners and faculty members. Today, I am proud to present QUANTARA AI—a production-grade, "
        "systematic stock market trend prediction and quantitative analytics platform engineered specifically for Indian equities.\n\n"
        "Unlike generic student projects that download a single stock's closing prices from Kaggle and feed them blindly into a basic LSTM, "
        "Quantara AI addresses the hard mathematical realities of quantitative finance: market non-stationarity, extreme noise, lookahead data leakage, "
        "and transaction costs.\n\n"
        "Over the course of this presentation, I will walk you through our complete pipeline: our 19,776-session NSE blue-chip dataset, our 20 mathematical "
        "feature extractors, our side-by-side benchmarking of regularized Machine Learning versus PyTorch Deep Learning (LSTM and GRU), our rigorous "
        "Purged Walk-Forward validation methodology, and finally, our live interactive trading terminal built with FastAPI and Next.js 14.\n\n"
        "Examiner Viva Tip: If asked why this project is unique, emphasize that it does not treat financial time series as simple synthetic regressions, "
        "but as an embargoed, friction-aware probabilistic classification problem."
    )

    # =========================================================================
    # SLIDE 2: Problem Statement, Motivation & Objectives
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2)
    add_header(slide2, 2, "Foundations", "Problem Statement, Motivation & Core Objectives", "Addressing why conventional retail prediction models fail in live financial markets.")

    # 3 Column Cards
    col_w = Inches(3.75)
    gap = Inches(0.28)

    # Col 1: The Problem
    add_card(slide2, Inches(0.8), Inches(1.8), col_w, Inches(4.8), BG_CARD, BORDER_LIGHT)
    tb = slide2.shapes.add_textbox(Inches(0.95), Inches(1.95), col_w - Inches(0.3), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "THE PROBLEM"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = LOSS_RED

    p2 = tf.add_paragraph()
    p2.text = "Why Most Market ML Fails"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(4)

    bullets1 = [
        ("Lookahead & Overlap Leakage", "Standard K-Fold cross-validation leaks forward-looking temporal information into past features, creating illusory 95%+ accuracies that collapse in live execution."),
        ("Non-Stationary Regimes", "Financial data exhibits dynamic mean and variance shifts. Models trained in bull markets fail catastrophically during chop and bear contractions."),
        ("Ignoring Trade Friction", "Theoretical models assume frictionless execution. Real-world brokerage, STT taxes, and bid-ask slippage quickly wipe out thin statistical edges.")
    ]
    for b_title, b_desc in bullets1:
        pb = tf.add_paragraph()
        pb.text = f"• {b_title}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(10)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_NAVY
        pb.space_before = Pt(8)
        run = pb.add_run()
        run.text = b_desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Col 2: The Motivation
    add_card(slide2, Inches(0.8) + col_w + gap, Inches(1.8), col_w, Inches(4.8), BG_CARD, BORDER_LIGHT)
    tb2 = slide2.shapes.add_textbox(Inches(0.95) + col_w + gap, Inches(1.95), col_w - Inches(0.3), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "THE MOTIVATION"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p2 = tf2.add_paragraph()
    p2.text = "Institutional-Grade Engineering"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(4)

    bullets2 = [
        ("Probabilistic Directional Alpha", "Rather than predicting noisy exact price levels, predicting 5-day probabilistic swing direction (UP / CHOP / DOWN) offers higher statistical stability."),
        ("Regime-Aware Cash Sizing", "When market breadth deteriorates below historical confidence thresholds, systematic models should retreat to cash or risk-free liquid funds."),
        ("Transparent White-Box Attribution", "Empower traders with SHAP (Shapley Additive exPlanations) so algorithmic decisions are explainable and mathematically auditable.")
    ]
    for b_title, b_desc in bullets2:
        pb = tf2.add_paragraph()
        pb.text = f"• {b_title}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(10)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_NAVY
        pb.space_before = Pt(8)
        run = pb.add_run()
        run.text = b_desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Col 3: The Project Objectives
    add_card(slide2, Inches(0.8) + (col_w + gap) * 2, Inches(1.8), col_w, Inches(4.8), BG_ACCENT_LIGHT, BORDER_BLUE)
    tb3 = slide2.shapes.add_textbox(Inches(0.95) + (col_w + gap) * 2, Inches(1.95), col_w - Inches(0.3), Inches(4.5))
    tf3 = tb3.text_frame
    tf3.word_wrap = True

    p = tf3.paragraphs[0]
    p.text = "CORE OBJECTIVES"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_DARK_BLUE

    p2 = tf3.add_paragraph()
    p2.text = "Key Project Deliverables"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(4)

    bullets3 = [
        ("Zero-Leakage Data Pipeline", "Construct an automated pipeline with 22-day forward-purging embargo to ensure zero temporal contamination."),
        ("Multi-Model Fair Benchmark", "Train and rigorously compare L2 Logistic Regression, Random Forest, LightGBM, and 60d LSTM/GRU architectures."),
        ("Real-World Friction Accounting", "Incorporate delivery commissions, slippage, and evaluate against Nippon India Liquid Fund (NAV ID 118701) cash yield."),
        ("Production Web Terminal", "Deliver a live interactive dashboard featuring TradingView charts, What-If simulation sliders, and real-time WebSocket tick feeds.")
    ]
    for b_title, b_desc in bullets3:
        pb = tf3.add_paragraph()
        pb.text = f"✔ {b_title}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(10)
        pb.font.bold = True
        pb.font.color.rgb = ACCENT_DARK_BLUE
        pb.space_before = Pt(7)
        run = pb.add_run()
        run.text = b_desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    slide2.notes_slide.notes_text_frame.text = (
        "On Slide 2, we establish the academic problem statement and the motivation driving Quantara AI.\n\n"
        "If you read typical published student papers on stock market prediction, you will often find claims of 90% or 95% directional accuracy. "
        "As any quantitative researcher will confirm, this is mathematically impossible in efficient markets and is almost always the result of data leakage—specifically, "
        "standard cross-validation shuffling future bars into past training folds, or failing to embargo multi-day overlapping target returns.\n\n"
        "In our project, we formulated three key objectives:\n"
        "First, eliminate all forms of data leakage by enforcing an embargoed temporal split.\n"
        "Second, do not predict noisy raw rupee price targets, but classify the probabilistic 5-day directional trend: Bullish expansion, Bearish contraction, or Neutral chop.\n"
        "Third, benchmark our models not just on theoretical F1 scores, but against genuine institutional benchmarks like the Nippon India Liquid Fund and equal-weight buy-and-hold.\n\n"
        "Examiner Viva Tip: If the examiner asks, 'Why did you predict direction rather than exact price with Linear Regression?', "
        "answer: 'Stock prices are integrated of order 1 (I(1)) non-stationary series. Predicting raw prices causes spurious regressions. "
        "Predicting forward return direction with stationary features satisfies Markovian properties and supports risk-adjusted portfolio sizing.'"
    )

    # =========================================================================
    # SLIDE 3: Dataset, Data Collection & Preprocessing
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3)
    add_header(slide3, 3, "Data Engineering", "Dataset Collection, Hygiene & Purged Preprocessing", "19,776 validated sessions across 8 NSE blue-chips with temporal embargo isolation.")

    # Left Container: Universe & Hygiene
    add_card(slide3, Inches(0.8), Inches(1.8), Inches(5.7), Inches(4.8), BG_CARD, BORDER_LIGHT)
    tb = slide3.shapes.add_textbox(Inches(1.0), Inches(1.95), Inches(5.3), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "DATASET UNIVERSE & SOURCE INTEGRITY"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p2 = tf.add_paragraph()
    p2.text = "8 High-Liquidity NSE Blue Chips (2016 – 2026)"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(3)

    univ_items = [
        ("Universe Composition", "TCS, RELIANCE, HDFCBANK, ICICIBANK, INFY, SBIN, BHARTIARTL, ITC representing ~45% of NIFTY 50 market weight."),
        ("Primary Source", "Yahoo Finance Daily Adjusted OHLCV bars ingested with authoritative dividend and stock-split adjustments (SHA-256 verified)."),
        ("Cash Benchmark Asset", "AMFI Official NAV history for Nippon India Liquid Fund (Scheme ID 118701) to accurately model risk-free capital yields."),
        ("Strict Hygiene Rule", "Zero synthetic data injection. Only authentic historical market prints used to preserve authentic leptokurtic distribution tails.")
    ]
    for u_t, u_d in univ_items:
        pb = tf.add_paragraph()
        pb.text = f"• {u_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(9.5)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_NAVY
        pb.space_before = Pt(6)
        run = pb.add_run()
        run.text = u_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Right Container: Purged Walk-Forward Splitting Architecture
    add_card(slide3, Inches(6.8), Inches(1.8), Inches(5.7), Inches(4.8), BG_ACCENT_LIGHT, BORDER_BLUE)
    tb2 = slide3.shapes.add_textbox(Inches(7.0), Inches(1.95), Inches(5.3), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "PREPROCESSING & PURGING ARCHITECTURE"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_DARK_BLUE

    p2 = tf2.add_paragraph()
    p2.text = "Chronological Embargoed Split (22-Day Buffer)"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(3)

    prep_items = [
        ("Chronological Train / Val / Test", "Train: 2016-01-01 to 2024-10-23 | Validation: 2024-10-24 to 2025-10-21 (247 sessions) | Reused Test: 2025-10-23 to 2026-10-23 (248 sessions)."),
        ("22-Day Horizon Purge Embargo", "Because our forward return labels look ahead up to 20 trading sessions, rows within 22 days before any split cutoff are rigorously purged to prevent label bleed."),
        ("Outlier Truncation & Winsorization", "Extreme return spikes winsorized at 0.1% and 99.9% percentiles to stabilize gradient optimization without discarding flash volatility."),
        ("Sequential Standardization", "StandardScaler and RobustScaler fitted solely on historical training windows; validation and test sets transformed using frozen training priors.")
    ]
    for p_t, p_d in prep_items:
        pb = tf2.add_paragraph()
        pb.text = f"✔ {p_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(9.5)
        pb.font.bold = True
        pb.font.color.rgb = ACCENT_DARK_BLUE
        pb.space_before = Pt(6)
        run = pb.add_run()
        run.text = p_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    slide3.notes_slide.notes_text_frame.text = (
        "Moving to Slide 3, we look under the hood of our dataset and data preprocessing engineering.\n\n"
        "We selected eight of the most liquid equities listed on the National Stock Exchange of India: Tata Consultancy Services, Reliance Industries, "
        "HDFC Bank, ICICI Bank, Infosys, State Bank of India, Bharti Airtel, and ITC. Together, these companies constitute approximately 45% of the NIFTY 50 index weight, "
        "ensuring our models learn from institutional liquidity pools rather than illiquid penny stocks subject to pump-and-dump anomalies.\n\n"
        "Notice our handling of splits: we used a chronological train/validation/test split spanning over 19,776 aggregate daily sessions. "
        "More importantly, look at our 22-day embargo mechanism: when calculating a 20-day forward return target, any trade initiated 5 days before the training cutoff "
        "contains price information that resolves after the cutoff. If you don't purge those boundary rows, your training set secretly contains test set outcomes. "
        "By enforcing a 22-day buffer purge, Quantara guarantees mathematical sterility.\n\n"
        "Examiner Viva Tip: If asked, 'What is the purpose of purging in financial machine learning?', "
        "refer to Marcos Lopez de Prado's Advances in Financial Machine Learning: 'Purging removes training labels whose evaluation overlap with the test set, "
        "eliminating serial correlation and forward leakage.'"
    )

    # =========================================================================
    # SLIDE 4: Feature Engineering & Technical Indicators
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4)
    add_header(slide4, 4, "Feature Engineering", "20 Domain-Specific Technical Indicators", "Mathematical transformations capturing trend, momentum, volatility, and volume dynamics.")

    # 4 Category Cards
    categories = [
        ("TREND & MOVING AVERAGES", ACCENT_BLUE, [
            ("adj_close_vs_sma20", "Normalized % distance of price from 20-day Simple Moving Average (mean-reversion signal)."),
            ("adj_close_vs_sma50", "Intermediate trend regime indicator (macro trend support/resistance)."),
            ("adj_close_vs_ema12", "Fast 12-day Exponential Moving Average deviation for short-term impulse."),
            ("adj_close_vs_ema20", "20-day EMA trend alignment filter."),
            ("adj_close_vs_ema26", "Slow EMA anchor used in MACD convergence calculation.")
        ]),
        ("MOMENTUM OSCILLATORS", ACCENT_DARK_BLUE, [
            ("rsi_14", "14-session Wilder Relative Strength Index measuring velocity of directional price moves."),
            ("macd_pct", "Moving Average Convergence Divergence line expressed as a percentage of close price."),
            ("macd_signal_pct", "9-day exponential moving average of the MACD percentage series."),
            ("macd_histogram_pct", "Differential between MACD and signal line, signaling early momentum acceleration."),
            ("return_5d & 20d", "Trailing cumulative returns over 5 and 20 sessions capturing intermediate inertia.")
        ]),
        ("VOLATILITY & ENVELOPES", LOSS_RED, [
            ("volatility_20d_annualized", "20-day rolling sample standard deviation annualized by sqrt(252)."),
            ("bollinger_percent_b", "%B metric indicating price position relative to upper and lower Bollinger Bands."),
            ("bollinger_width_pct", "Bandwidth indicator measuring volatility squeezes and upcoming breakout regime shifts."),
            ("intraday_range_pct", "Session (High - Low) normalized by Open price measuring intraday dispersion.")
        ]),
        ("VOLUME & MICROSTRUCTURE", GAIN_GREEN, [
            ("log_volume_change", "Logarithmic differential of volume capturing institutional accumulation/distribution."),
            ("volume_vs_sma20", "Ratio of current volume against 20-day volume SMA (liquidity surge detector)."),
            ("open_gap_pct", "Overnight gap percentage (Open - Previous Close) / Previous Close."),
            ("close_location_in_range", "(Close - Low) / (High - Low) representing end-of-day buyer vs seller dominance.")
        ])
    ]

    for i, (cat_title, color, feats) in enumerate(categories):
        c_left = Inches(0.8 + (i % 2) * 5.95)
        c_top = Inches(1.8 + (i // 2) * 2.45)
        
        add_card(slide4, c_left, c_top, Inches(5.8), Inches(2.3), BG_CARD, BORDER_LIGHT)
        
        tb = slide4.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.1), Inches(5.5), Inches(2.1))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = cat_title
        p.font.name = FONT_FAMILY
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = color
        
        for f_name, f_desc in feats:
            pf = tf.add_paragraph()
            pf.text = f"{f_name}: "
            pf.font.name = FONT_FAMILY
            pf.font.size = Pt(8.5)
            pf.font.bold = True
            pf.font.color.rgb = TEXT_NAVY
            pf.space_before = Pt(2)
            run = pf.add_run()
            run.text = f_desc
            run.font.bold = False
            run.font.color.rgb = TEXT_MUTED

    slide4.notes_slide.notes_text_frame.text = (
        "Slide 4 covers our feature engineering methodology. Machine learning models cannot consume raw non-stationary stock prices directly. "
        "Therefore, we engineered exactly 20 domain-specific technical features classified into four orthogonal analytical pillars:\n\n"
        "1. Trend & Moving Averages: Rather than feeding raw moving average numbers, we normalized them as percentage deviations from price. "
        "For example, 'adj_close_vs_sma20' tells the model whether an asset is overextended above its 20-day mean.\n\n"
        "2. Momentum Oscillators: We calculate Wilder's 14-day RSI and percentage-normalized MACD histograms. This prevents high-priced stocks "
        "like TCS from dominating low-priced stocks like ITC simply due to rupee magnitude.\n\n"
        "3. Volatility Envelopes: We use 20-day annualized volatility and Bollinger Bandwidth. When bandwidth collapses to multi-month lows, "
        "it indicates a volatility squeeze preceding violent breakouts.\n\n"
        "4. Volume & Microstructure: We capture institutional accumulation through log volume changes and the 'close_location_in_range' metric, "
        "which reveals whether institutional buying supported the stock into the closing bell.\n\n"
        "Examiner Viva Tip: If asked, 'Why did you use percentage MACD rather than standard rupee MACD?', "
        "answer: 'A ₹50 MACD move on Reliance is normal, but on ITC it is a 20% swing. Percentage normalization makes features scale-invariant across the entire universe.'"
    )

    # =========================================================================
    # SLIDE 5: Machine Learning Algorithms Implemented
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5)
    add_header(slide5, 5, "Machine Learning", "Statistical & Tree-Based Machine Learning Models", "Three distinct learning paradigms benchmarking linear baselines against non-linear tree ensembles.")

    ml_models = [
        ("LOGISTIC REGRESSION (L2 REGULARIZED)", ACCENT_BLUE, [
            ("Mathematical Foundation", "Logit link function modeling log-odds: ln(p / (1 - p)) = w^T x + b with Ridge (L2) penalty 0.5 * lambda * ||w||^2."),
            ("Why Selected", "Provides a robust, convex baseline that cannot overfit noise easily and gives calibrated posterior probabilities."),
            ("Feature Ingestion", "Receives the 20 standardized technical features scaled to zero mean and unit variance."),
            ("Role in Quantara", "Serves as the empirical anchor. If complex deep networks cannot beat regularized logistic regression, they fail the Occam's razor test.")
        ]),
        ("RANDOM FOREST CLASSIFIER (ENSEMBLE)", ACCENT_DARK_BLUE, [
            ("Mathematical Foundation", "Bagging ensemble of 150 randomized decision trees utilizing Gini impurity split criteria and bootstrap aggregation."),
            ("Why Selected", "Naturally captures non-linear feature interactions (e.g., RSI overbought occurring simultaneously with low Bollinger bandwidth)."),
            ("Feature Ingestion", "Invariant to monotonic feature scaling; consumes raw percentage indicators without distortion."),
            ("Role in Quantara", "Reduces variance through orthogonal tree decorrelation and generates empirical out-of-bag validation estimates.")
        ]),
        ("LIGHTGBM GRADIENT BOOSTED TREES", GAIN_GREEN, [
            ("Mathematical Foundation", "Histogram-based gradient boosting with Leaf-wise (best-first) tree growth and gradient-based one-side sampling (GOSS)."),
            ("Why Selected", "State-of-the-art tabular classification efficiency; handles sparse feature distributions and subtle non-linear thresholds."),
            ("Feature Ingestion", "Consumes 20 features mapped into discrete 256-bin histograms for high cache efficiency."),
            ("Role in Quantara", "Primary non-linear benchmark algorithm for short-horizon (1D and 5D) directional classifications.")
        ])
    ]

    for i, (m_name, color, details) in enumerate(ml_models):
        c_left = Inches(0.8 + i * 3.98)
        add_card(slide5, c_left, Inches(1.8), Inches(3.8), Inches(4.8), BG_CARD, BORDER_LIGHT)
        
        tb = slide5.shapes.add_textbox(c_left + Inches(0.15), Inches(1.95), Inches(3.5), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = m_name
        p.font.name = FONT_FAMILY
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = color

        for d_title, d_text in details:
            pd = tf.add_paragraph()
            pd.text = f"{d_title}:"
            pd.font.name = FONT_FAMILY
            pd.font.size = Pt(10)
            pd.font.bold = True
            pd.font.color.rgb = TEXT_NAVY
            pd.space_before = Pt(8)
            
            pdt = tf.add_paragraph()
            pdt.text = d_text
            pdt.font.name = FONT_FAMILY
            pdt.font.size = Pt(9)
            pdt.font.color.rgb = TEXT_MUTED

    slide5.notes_slide.notes_text_frame.text = (
        "On Slide 5, we explore the three traditional machine learning algorithms implemented in our suite:\n\n"
        "1. L2-Regularized Logistic Regression: Many data scientists dismiss logistic regression as too simple. However, in quantitative finance, "
        "simple regularized linear models often outperform deep networks because financial signal-to-noise ratios are notoriously low (~0.05). "
        "Our logistic regression model optimizes the cross-entropy log-loss with an L2 Ridge penalty to prevent any single technical indicator from dominating weights.\n\n"
        "2. Random Forest: Markets exhibit non-linear regime interactions—for instance, an RSI above 70 means 'overbought' in a range-bound market, "
        "but represents 'momentum breakout' in a trending market. A single linear model cannot distinguish this. Random Forest captures this interaction "
        "by combining 150 decorrelated decision trees.\n\n"
        "3. LightGBM: We chose LightGBM over standard XGBoost due to its leaf-wise tree growth and histogram binning. It converges significantly faster "
        "and handles subtle non-linear decision boundaries with high sample efficiency.\n\n"
        "Examiner Viva Tip: If asked, 'What loss function was optimized in LightGBM and Logistic Regression?', "
        "answer: 'Binary/Multi-class Cross-Entropy Log-Loss, with sample class weighting to account for the empirical distribution of UP versus DOWN market days.'"
    )

    # =========================================================================
    # SLIDE 6: Deep Learning Algorithms & Model Architecture
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_bg(slide6)
    add_header(slide6, 6, "Deep Learning", "PyTorch Recurrent Deep Learning Architectures (LSTM & GRU)", "Sequence-to-vector recurrent neural networks learning 60-day temporal dependency representations.")

    # Left: Architecture Specs
    add_card(slide6, Inches(0.8), Inches(1.8), Inches(6.0), Inches(4.8), BG_CARD, BORDER_LIGHT)
    tb = slide6.shapes.add_textbox(Inches(1.0), Inches(1.95), Inches(5.6), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "NETWORK TOPOLOGY & HYPERPARAMETERS"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p2 = tf.add_paragraph()
    p2.text = "PyTorch 2.15 Implementation (Phase 24 Specification)"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(3)

    dl_specs = [
        ("Input Tensor Shape", "[Batch Size: 64, Sequence Length: 60, Feature Dimension: 15] representing 60 consecutive trading sessions."),
        ("LSTM Network (56,162 Params)", "2-layer LSTM with hidden_size = 64, inter-layer dropout = 0.20, followed by FC projection: [64 -> 32 -> 2 classes]."),
        ("GRU Network (42,658 Params)", "2-layer Gated Recurrent Unit with hidden_size = 64, inter-layer dropout = 0.20, FC layers: [32 -> 2 classes]."),
        ("Optimization & Regularization", "Adam optimizer (lr = 0.001, weight_decay = 1e-4), early stopping patience = 8 epochs (best weights at epoch 5)."),
        ("Class Imbalance Weighting", "CrossEntropyLoss with inverted prior weights: DOWN weight = 1.329, UP weight = 0.802.")
    ]
    for s_t, s_d in dl_specs:
        pb = tf.add_paragraph()
        pb.text = f"• {s_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(9.5)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_NAVY
        pb.space_before = Pt(6)
        run = pb.add_run()
        run.text = s_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Right: Mathematical Internal Mechanics (LSTM vs GRU Gating)
    add_card(slide6, Inches(7.0), Inches(1.8), Inches(5.5), Inches(4.8), BG_ACCENT_LIGHT, BORDER_BLUE)
    tb2 = slide6.shapes.add_textbox(Inches(7.2), Inches(1.95), Inches(5.1), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "RECURRENT GATING MECHANISMS"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_DARK_BLUE

    p2 = tf2.add_paragraph()
    p2.text = "Why Gated Cells Resolve Vanishing Gradients"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(3)

    gate_details = [
        ("LSTM 3-Gate Cell State", "Maintains an additive cell state C_t regulated by Forget Gate f_t, Input Gate i_t, and Output Gate o_t. Gradient flows back across 60 timesteps without exponential decay."),
        ("GRU Reset & Update Gates", "Merges hidden state and cell state into h_t using Update Gate z_t and Reset Gate r_t. Reduces parameter count by ~24% (42k vs 56k) for faster convergence on CPU."),
        ("Sequence-to-Vector Mapping", "Only the final hidden state h_60 is extracted and passed to the classifier head, compressing the 60-day historical path into a latent conviction vector.")
    ]
    for g_t, g_d in gate_details:
        pb = tf2.add_paragraph()
        pb.text = f"✔ {g_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(9.5)
        pb.font.bold = True
        pb.font.color.rgb = ACCENT_DARK_BLUE
        pb.space_before = Pt(7)
        run = pb.add_run()
        run.text = g_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    slide6.notes_slide.notes_text_frame.text = (
        "Slide 6 covers the Deep Learning architectures implemented in Phase 24 of our research: Recurrent Neural Networks using LSTM and GRU cells in PyTorch.\n\n"
        "Why did we use 60-day sequences? In the Indian markets, approximately 60 trading days corresponds to one complete earnings quarter (3 calendar months). "
        "By feeding a tensor of shape [batch_size, 60 timesteps, 15 features], the recurrent cells are forced to model how technical patterns evolve over an entire quarter.\n\n"
        "Look at our architecture parameters: our LSTM has 56,162 parameters, while our GRU has 42,658 parameters. Notice that we kept the capacity modest: "
        "in financial deep learning, huge models with millions of parameters quickly memorize noise and overfit. We utilized a 2-layer stacked RNN with 64 hidden units, "
        "inter-layer dropout of 0.20, and fully connected dropout of 0.30.\n\n"
        "Crucially, we applied class-weighted Cross-Entropy loss. Since market regimes sometimes have more UP days than DOWN days during bull expansions, "
        "weighting the loss ensures the neural network does not collapse into simply predicting the majority class.\n\n"
        "Examiner Viva Tip: If the examiner asks, 'What is the mathematical difference between LSTM and GRU?', "
        "explain: 'LSTM uses three gates (Input, Forget, Output) and maintains separate cell state C_t and hidden state h_t. "
        "GRU merges cell and hidden state into a single h_t using only two gates (Reset and Update), making it faster and less prone to overfitting on small datasets.'"
    )

    # =========================================================================
    # SLIDE 7: Complete System Architecture & Project Workflow
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_bg(slide7)
    add_header(slide7, 7, "System Architecture", "End-to-End System Architecture & Data Workflow", "Modular pipeline from raw market exchange feeds to client-side GPU-accelerated visualizations.")

    # 4 Architecture Horizontal Stages
    stages = [
        ("1. DATA INGESTION", ACCENT_BLUE, [
            "Yahoo Finance Daily OHLCV",
            "AMFI Nippon Liquid Fund NAV",
            "Real-time yfinance Tickers API",
            "SHA-256 Checksum Validation",
            "Zero Synthetic Data Enforced"
        ]),
        ("2. FEATURE PIPELINE", ACCENT_DARK_BLUE, [
            "20 Mathematical Technical Features",
            "22-Day Split Embargo Purge",
            "RobustScaler Standardization",
            "60-Day Sequence Tensor Builder",
            "SHAP TreeExplainer Weighting"
        ]),
        ("3. MODEL INFERENCE", GAIN_GREEN, [
            "L2 Logistic Regression Anchor",
            "LightGBM & Random Forest Trees",
            "PyTorch 2.15 LSTM & GRU RNNs",
            "Multi-Model Consensus Voting",
            "Regime-Aware Cash Sizing"
        ]),
        ("4. PRESENTATION TIER", LOSS_RED, [
            "FastAPI Asynchronous Engine",
            "WebSocket /ws/ticks Streaming",
            "Next.js 14 App Router (React 18)",
            "TradingView Lightweight Charts v4",
            "D3.js Forward Predictive Bands"
        ])
    ]

    for i, (st_name, st_col, st_points) in enumerate(stages):
        s_left = Inches(0.8 + i * 2.98)
        add_card(slide7, s_left, Inches(1.8), Inches(2.85), Inches(4.8), BG_CARD, BORDER_LIGHT)

        tb = slide7.shapes.add_textbox(s_left + Inches(0.12), Inches(1.95), Inches(2.6), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = st_name
        p.font.name = FONT_FAMILY
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = st_col

        for pt_text in st_points:
            p_pt = tf.add_paragraph()
            p_pt.text = f"• {pt_text}"
            p_pt.font.name = FONT_FAMILY
            p_pt.font.size = Pt(9.5)
            p_pt.font.color.rgb = TEXT_NAVY
            p_pt.space_before = Pt(8)

    slide7.notes_slide.notes_text_frame.text = (
        "Slide 7 illustrates the complete end-to-end engineering architecture of Quantara AI.\n\n"
        "We designed the system as four decoupled, modular tiers:\n"
        "Tier 1 is Ingestion: Raw equity quotes from the National Stock Exchange and risk-free cash benchmarks from AMFI are verified with SHA-256 checksums.\n"
        "Tier 2 is Feature Engineering: Raw OHLCV bars are transformed into our 20 stationary feature vectors, purged across 22-day embargo boundaries, "
        "and formatted into 60-day tensors for deep learning.\n"
        "Tier 3 is Inference: The models run inference simultaneously. A consensus module evaluates whether Logistic Regression, Random Forest, "
        "and LightGBM agree. If the market regime breadth drops below 37.5%, the system overrides model predictions and commands 100% Cash holding.\n"
        "Tier 4 is the Web Terminal: Built with FastAPI in Python and Next.js 14 in TypeScript. Real-time ticks stream over WebSockets into TradingView Lightweight Charts, "
        "while forward predictive envelopes and SHAP feature importance are rendered using custom D3.js SVGs.\n\n"
        "Examiner Viva Tip: If asked, 'Why separate FastAPI and Next.js rather than using a pure Python Streamlit dashboard?', "
        "answer: 'Streamlit re-runs the entire Python script on every state change, causing 500ms+ lag and preventing institutional chart zooming. "
        "Our architecture decouples high-performance client-side WebGL/Canvas rendering (Next.js) from the asynchronous Python inference backend.'"
    )

    # =========================================================================
    # SLIDE 8: Model Evaluation, Results & ML vs DL Comparison
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_bg(slide8)
    add_header(slide8, 8, "Model Evaluation", "Empirical Evaluation: ML vs DL Walk-Forward Comparison", "Tested on 4,647 out-of-sample prediction samples across expanding walk-forward folds.")

    # Table of Actual Results (Phase 26 Pooled Out-of-Sample Metrics)
    rows_data = [
        ["Model Architecture", "Samples", "Bal. Acc", "Macro F1", "Brier Score", "Log Loss", "Economic Alpha"],
        ["Majority Baseline (Naive)", "4,647", "50.00%", "35.75%", "0.2521", "0.6977", "Benchmark 0.0%"],
        ["Logistic Regression (L2)", "4,647", "50.07%", "49.91%", "0.2505", "0.6942", "+5.03% vs Buy&Hold"],
        ["LSTM Classifier (60d)", "4,647", "49.92%", "46.89%", "0.2524", "0.6983", "+2.71% vs Buy&Hold"],
        ["GRU Classifier (60d)", "4,647", "48.68%", "39.37%", "0.2528", "0.6992", "+0.95% vs Buy&Hold"]
    ]

    # Render Table
    t_left = Inches(0.8)
    t_top = Inches(1.8)
    t_width = Inches(11.8)
    t_height = Inches(2.2)

    table_shape = slide8.shapes.add_table(5, 7, t_left, t_top, t_width, t_height)
    table = table_shape.table

    for r_idx, row in enumerate(rows_data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_FAMILY
            p.font.size = Pt(10)
            if r_idx == 0:
                p.font.bold = True
                p.font.color.rgb = ACCENT_DARK_BLUE
                cell.fill.solid()
                cell.fill.fore_color.rgb = BG_ACCENT_LIGHT
            else:
                p.font.color.rgb = TEXT_NAVY
                cell.fill.solid()
                cell.fill.fore_color.rgb = BG_WHITE if r_idx % 2 == 1 else BG_CARD

    # 3 Key Analytical Findings Cards
    findings = [
        ("THE EMPIRICAL ML VS DL REALITY", ACCENT_BLUE, 
         "Under rigorous purged walk-forward validation (4,647 samples), L2 Logistic Regression achieved the highest Macro F1 (49.91%) and lowest Log Loss (0.6942). Deep LSTM (46.89% F1) and GRU (39.37% F1) suffered from noisy gradient updates and lower sample efficiency."),
        
        ("PROBABILITY CALIBRATION (BRIER SCORE)", ACCENT_DARK_BLUE, 
         "Logistic Regression scored the best Brier score (0.2505), indicating reliable probabilistic calibration. LSTMs exhibited slight overconfidence in extreme market tails, confirming that linear regularizers remain superior for noisy daily tabular market data."),
        
        ("ECONOMIC VALUE OVER PURE ACCURACY", GAIN_GREEN, 
         "While raw directional accuracy hovers near 51-53% (consistent with weak-form market efficiency), Quantara's asymmetric sizing and cash benchmark regime filters generated +5.03% economic alpha over passive buy-and-hold during severe market drawdowns.")
    ]

    for i, (f_title, f_col, f_text) in enumerate(findings):
        c_left = Inches(0.8 + i * 3.98)
        add_card(slide8, c_left, Inches(4.3), Inches(3.8), Inches(2.3), BG_CARD, BORDER_LIGHT)

        tb = slide8.shapes.add_textbox(c_left + Inches(0.12), Inches(4.45), Inches(3.55), Inches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f_title
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = f_col

        p2 = tf.add_paragraph()
        p2.text = f_text
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(9)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(4)

    slide8.notes_slide.notes_text_frame.text = (
        "Slide 8 is arguably the most critical technical slide in our entire presentation. Here we present our actual verified out-of-sample metrics "
        "across 4,647 forward test sessions from Phase 26 of our project.\n\n"
        "Look at the comparison table: many candidates claim their Deep Learning LSTM achieved 90% accuracy. Our research demonstrates academic honesty: "
        "when evaluated on genuine out-of-sample data with zero data leakage, stock market predictability is bounded by weak-form market efficiency. "
        "Standard accuracy hovers around 51% to 53%.\n\n"
        "However, look at the Macro F1 and Brier scores: our L2-regularized Logistic Regression achieved a Macro F1 of 49.91% and the lowest Brier score of 0.2505, "
        "outperforming both LSTM (46.89%) and GRU (39.37%). Why? Because financial daily returns have a very low signal-to-noise ratio. "
        "Complex 56,000-parameter LSTM networks attempt to fit non-linear patterns that are actually transient statistical noise. "
        "The regularized linear model does not overfit, making its predicted probabilities more reliable.\n\n"
        "Furthermore, our strategy generates significant economic alpha (+5.03% over buy-and-hold) because we use asymmetric risk management: "
        "we don't need 80% accuracy if our regime filters protect capital during market crashes.\n\n"
        "Examiner Viva Tip: If the examiner challenges: 'Why did Logistic Regression beat your Deep Learning LSTM?', "
        "answer: 'Because financial daily time-series suffer from low signal-to-noise ratio and structural regime shifts. "
        "According to the Bias-Variance tradeoff, high-capacity neural networks suffer from high estimation variance on noisy tabular regimes, "
        "whereas regularized linear models exhibit lower variance and superior probabilistic calibration (Brier score 0.2505 vs 0.2524).'"
    )

    # =========================================================================
    # SLIDE 9: Website Dashboard, Functionalities & Live Demo
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_bg(slide9)
    add_header(slide9, 9, "Terminal Dashboard", "Institutional Dashboard Interface & Live Demonstration", "High-frequency analytics terminal featuring TradingView charts, D3 predictive fans, and live NSE ticks.")

    # Left Container: Actual Screenshot Image
    img_path = "c:\\Quantara\\Quantara_ai-main\\screenshot_dashboard.png"
    if os.path.exists(img_path):
        slide9.shapes.add_picture(img_path, Inches(0.8), Inches(1.8), Inches(6.8), Inches(4.8))
        # Border frame around image
        frame = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(6.8), Inches(4.8))
        frame.fill.background()
        frame.line.color.rgb = BORDER_BLUE
        frame.line.width = Pt(1.5)
    else:
        add_card(slide9, Inches(0.8), Inches(1.8), Inches(6.8), Inches(4.8), BG_CARD, BORDER_LIGHT)

    # Right Container: 4 Functional Capabilities
    add_card(slide9, Inches(7.8), Inches(1.8), Inches(4.8), Inches(4.8), BG_ACCENT_LIGHT, BORDER_BLUE)
    tb = slide9.shapes.add_textbox(Inches(8.0), Inches(1.95), Inches(4.4), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "CORE INTERFACE CAPABILITIES"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_DARK_BLUE

    p2 = tf.add_paragraph()
    p2.text = "Interactive Trading Terminal Features"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(3)

    features = [
        ("TradingView Candlestick Studio", "Lightweight Charts v4 renderer with SMA 20/50 overlays, dynamic volume histograms, and sub-millisecond panning/zooming."),
        ("D3 Forward Predictive Envelope", "Plots the 5-day probabilistic forecast path surrounded by 50% and 90% confidence uncertainty bands based on empirical volatility."),
        ("Interactive 'What-If' Simulation", "Real-time slider controls allowing traders to stress-test market parameters (volatility shift, volume surges, sentiment) and observe dynamic model reaction."),
        ("Live NSE Tick Feeds & Order Blotter", "WebSocket tick engine streaming real-time prices (e.g. TCS ₹2,436.90, Reliance ₹1,299.50) with instant green/red trade flash animations and 260-trade ledger audit.")
    ]

    for f_t, f_d in features:
        pb = tf.add_paragraph()
        pb.text = f"✔ {f_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(9.5)
        pb.font.bold = True
        pb.font.color.rgb = ACCENT_DARK_BLUE
        pb.space_before = Pt(6)
        run = pb.add_run()
        run.text = f_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    slide9.notes_slide.notes_text_frame.text = (
        "Slide 9 presents our live production application—the Quantara Institutional Trading Dashboard.\n\n"
        "On the left, you can see an actual screenshot captured directly from our running Next.js application at localhost:3000/dashboard. "
        "The interface was intentionally designed with an institutional, Bloomberg/TradingView aesthetic—zero distracting AI marketing tropes, "
        "no emojis, crisp 1-pixel hairline borders, and JetBrains Mono tabular numbers to eliminate digit jitter during live updates.\n\n"
        "Let me highlight the four core interactive features of our dashboard:\n"
        "First, our TradingView technical candlestick engine: it renders multi-timeframe historical sessions with SMA 20 and SMA 50 overlays.\n"
        "Second, our D3.js predictive fan chart: rather than misleading the trader with a single deterministic forecast line, "
        "it plots the forward 5-day median path surrounded by 50% and 90% confidence uncertainty envelopes.\n"
        "Third, our 'What-If' Simulation Studio: traders can adjust interactive sliders for volatility and volume multipliers to re-query the model "
        "and observe how conviction shifts in real time.\n"
        "Fourth, our live WebSocket tick engine: it connects directly to our FastAPI backend, streaming live price ticks from Yahoo Finance for Indian blue chips "
        "with TradingView-style green/red price flash micro-interactions.\n\n"
        "Examiner Viva Tip: If the examiner asks to see the live project, open the browser to http://localhost:3000/dashboard and demonstrate: "
        "(1) Toggling between TCS and Reliance, (2) moving the What-If volatility slider, and (3) showing the live order blotter table."
    )

    # =========================================================================
    # SLIDE 10: Conclusion, Project Limitations & Future Scope
    # =========================================================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_bg(slide10)
    add_header(slide10, 10, "Summary & Outlook", "Conclusion, Limitations & Future Research Directions", "Critical reflections on quantitative modeling limits and roadmap for high-frequency extensions.")

    # 3 Summary Cards
    col_w = Inches(3.75)
    gap = Inches(0.28)

    # Box 1: Conclusions
    add_card(slide10, Inches(0.8), Inches(1.8), col_w, Inches(4.8), BG_CARD, BORDER_LIGHT)
    tb1 = slide10.shapes.add_textbox(Inches(0.95), Inches(1.95), col_w - Inches(0.3), Inches(4.5))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "KEY RESEARCH CONCLUSIONS"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p2 = tf1.add_paragraph()
    p2.text = "What the Empirical Data Proved"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(4)

    concl_items = [
        ("Sterile Methodology is Paramount", "Purged walk-forward validation proves that theoretical 90%+ market models are artifacts of data leakage. Real directional edge is subtle (~50-53%)."),
        ("Linear Regularization Beats Deep RNNs", "L2-penalized Logistic Regression outperformed 2-layer LSTM and GRU in Macro F1 (49.91% vs 46.89%) and probability calibration."),
        ("Regime Defense Creates True Alpha", "Systematic capital preservation during contraction regimes yielded +5.03% alpha over passive buy-and-hold.")
    ]
    for c_t, c_d in concl_items:
        pb = tf1.add_paragraph()
        pb.text = f"• {c_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(10)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_NAVY
        pb.space_before = Pt(8)
        run = pb.add_run()
        run.text = c_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Box 2: Limitations
    add_card(slide10, Inches(0.8) + col_w + gap, Inches(1.8), col_w, Inches(4.8), BG_CARD, BORDER_LIGHT)
    tb2 = slide10.shapes.add_textbox(Inches(0.95) + col_w + gap, Inches(1.95), col_w - Inches(0.3), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "HONEST PROJECT LIMITATIONS"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = LOSS_RED

    p2 = tf2.add_paragraph()
    p2.text = "Academic & Technical Bounds"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(4)

    limits_items = [
        ("Daily End-of-Day Bar Resolution", "The system operates on daily aggregated EOD bars. It does not model Level-2 tick queue dynamics or intraday microsecond order cancellations."),
        ("Simplified Execution Slippage", "Friction models assume instantaneous execution at the next session's Open price, which may deviate during high-volatility opening gap auctions."),
        ("Pure Technical Feature Scope", "The current models evaluate price-volume indicators only, without processing natural language earnings transcripts or macroeconomic RBI policy releases.")
    ]
    for l_t, l_d in limits_items:
        pb = tf2.add_paragraph()
        pb.text = f"• {l_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(10)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_NAVY
        pb.space_before = Pt(8)
        run = pb.add_run()
        run.text = l_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Box 3: Future Scope
    add_card(slide10, Inches(0.8) + (col_w + gap) * 2, Inches(1.8), col_w, Inches(4.8), BG_ACCENT_LIGHT, BORDER_BLUE)
    tb3 = slide10.shapes.add_textbox(Inches(0.95) + (col_w + gap) * 2, Inches(1.95), col_w - Inches(0.3), Inches(4.5))
    tf3 = tb3.text_frame
    tf3.word_wrap = True

    p = tf3.paragraphs[0]
    p.text = "FUTURE RESEARCH ROADMAP"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_DARK_BLUE

    p2 = tf3.add_paragraph()
    p2.text = "Next-Generation Enhancements"
    p2.font.name = FONT_FAMILY
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_NAVY
    p2.space_before = Pt(4)

    future_items = [
        ("Multi-Modal FinBERT Sentiment", "Integrate news sentiment and quarterly corporate earnings sentiment vectors via transformer models into the feature matrix."),
        ("Reinforcement Learning Execution", "Implement PPO (Proximal Policy Optimization) agents for optimal trade routing and dynamic stop-loss trailing."),
        ("Automated Broker API Webhooks", "Connect paper execution webhooks directly to Zerodha Kite Connect or Upstox APIs for autonomous forward testing.")
    ]
    for ft_t, ft_d in future_items:
        pb = tf3.add_paragraph()
        pb.text = f"✔ {ft_t}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(10)
        pb.font.bold = True
        pb.font.color.rgb = ACCENT_DARK_BLUE
        pb.space_before = Pt(8)
        run = pb.add_run()
        run.text = ft_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    slide10.notes_slide.notes_text_frame.text = (
        "To conclude our presentation on Slide 10, let us review the overarching conclusions, honest engineering limitations, and future roadmap of Quantara AI.\n\n"
        "In conclusion: our project demonstrated that rigorous quantitative methodology, purged embargo cross-validation, and capital preservation rules "
        "matter far more in real financial markets than blindly increasing neural network complexity. "
        "We showed that simpler, well-regularized models like L2 Logistic Regression achieve superior generalization and calibration over recurrent neural networks "
        "on noisy daily tabular data.\n\n"
        "We also acknowledge our honest engineering limitations: our model operates on end-of-day daily bars rather than high-frequency millisecond order books, "
        "and currently evaluates technical and volume price action without incorporating news sentiment.\n\n"
        "For future scope, we plan to incorporate multi-modal transformer sentiment analysis using FinBERT on corporate earnings calls and deploy automated paper-trading webhooks "
        "via Zerodha Kite Connect.\n\n"
        "Thank you very much, respected examiners. I am now ready and look forward to answering any technical questions regarding our mathematical models, "
        "deep learning architectures, and system implementation."
    )

    output_path = "c:\\Quantara\\Quantara_ai-main\\QUANTARA_PROJECT_PRESENTATION.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    build_quantara_presentation()

