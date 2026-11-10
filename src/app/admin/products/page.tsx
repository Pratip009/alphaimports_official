"use client";
import { useEffect, useState, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import {
  SHAPES, COLORS, CLARITIES, CERTIFICATIONS,
  WATCH_GENDERS, WATCH_BRANDS, WATCH_MOVEMENTS,
  WATCH_STRAP_TYPES, WATCH_CASE_MATERIALS, WATCH_DIAL_COLORS,
  WATCH_FEATURES, WATCH_STYLES, WATCH_CASE_SIZES,
  MEMO_MAX_DAYS_CEILING,
} from "@/models/Product";
import Link from "next/link";

/* ── Inline design tokens ─────────────────────────────────────────────────── */
const css = `
  .ap-root { font-family: Verdana, Geneva, Tahoma, sans-serif; color: #222222; background: #f5f7fb; min-height: 100vh; padding: 2rem; }
  .ap-root * { box-sizing: border-box; }

  .ap-display { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 1.75rem; color: #222222; letter-spacing: -0.02em; }
  .ap-breadcrumb { font-size: 0.8rem; color: #7f7f7f; font-weight: 500; text-decoration: none; letter-spacing: 0.04em; text-transform: uppercase; }
  .ap-breadcrumb:hover { color: #b45309; }

  .ap-card { background: #fff; border: 1px solid #c6cbd6; border-radius: 3px; }
  .ap-card-inner { padding: 1.75rem; }

  .ap-section-title { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 1.1rem; color: #222222; margin: 0 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid #c6cbd6; }

  .ap-label { display: block; font-size: 0.72rem; font-weight: 600; color: #555555; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 0.4rem; }
  .ap-label-hint { font-size: 0.7rem; color: #999999; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 0.4rem; }

  .ap-input { width: 100%; height: 40px; padding: 0 0.875rem; border: 1.5px solid #a6aec5; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.875rem; color: #222222; background: #f5f7fb; transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
  .ap-input:focus { border-color: #b45309; box-shadow: 0 0 0 3px rgba(180,83,9,0.1); background: #fff; }
  .ap-input::placeholder { color: #999999; }
  .ap-textarea { height: auto; padding: 0.625rem 0.875rem; resize: none; line-height: 1.6; }
  select.ap-input { cursor: pointer; }
  .ap-input:disabled { background: #eef0f5; color: #999999; cursor: not-allowed; border-color: #c6cbd6; }

  .ap-btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0 1.25rem; height: 40px; background: #1c4874; color: #fff; border: none; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.825rem; font-weight: 600; letter-spacing: 0.03em; cursor: pointer; transition: background 0.15s, transform 0.1s; }
  .ap-btn-primary:hover { background: #1c4874; }
  .ap-btn-primary:active { transform: scale(0.98); }
  .ap-btn-primary:disabled { background: #c6cbd6; cursor: not-allowed; }
  .ap-btn-primary.full { width: 100%; justify-content: center; height: 44px; font-size: 0.9rem; background: #b45309; }
  .ap-btn-primary.full:hover { background: #92400e; }

  .ap-btn-ghost { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0 1.1rem; height: 40px; background: transparent; color: #555555; border: 1.5px solid #a6aec5; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.825rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
  .ap-btn-ghost:hover { border-color: #b45309; color: #b45309; background: #fef3c7; }

  .ap-btn-danger { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0 1.1rem; height: 40px; background: transparent; color: #dc2626; border: 1.5px solid #fca5a5; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .ap-btn-danger:hover { background: #fef2f2; border-color: #dc2626; }
  .ap-btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

  .ap-btn-success { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0 1.1rem; height: 40px; background: transparent; color: #15803d; border: 1.5px solid #86efac; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.825rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .ap-btn-success:hover { background: #f0fdf4; border-color: #15803d; }
  .ap-btn-success:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Product type toggle */
  .ap-type-toggle { display: flex; background: #eef0f5; border-radius: 3px; padding: 4px; gap: 4px; margin-bottom: 1.5rem; }
  .ap-type-btn { flex: 1; height: 38px; border: none; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.18s; color: #7f7f7f; background: transparent; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .ap-type-btn.active { background: #fff; color: #222222; box-shadow: 0 1px 4px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.06); }
  .ap-type-btn:hover:not(.active) { color: #b45309; }

  /* Subsection divider */
  .ap-subsection { grid-column: span 2; margin: 0.5rem 0 0; padding-top: 1rem; border-top: 1px dashed #c6cbd6; }
  .ap-subsection-title { font-size: 0.72rem; font-weight: 700; color: #999999; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem; }

  .ap-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  @media (max-width: 640px) { .ap-form-grid { grid-template-columns: 1fr; } .ap-col-2 { grid-column: span 1 !important; } .ap-subsection { grid-column: span 1; } }
  .ap-col-2 { grid-column: span 2; }

  .ap-pill-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.4rem; padding: 0.75rem; background: #f5f7fb; border: 1.5px solid #a6aec5; border-radius: 3px; }
  .ap-pill { padding: 4px 11px; border-radius: 3px; border: 1.5px solid #a6aec5; font-size: 0.75rem; font-weight: 500; color: #555555; background: #fff; cursor: pointer; transition: all 0.12s; font-family: Verdana, Geneva, Tahoma, sans-serif; }
  .ap-pill:hover { border-color: #b45309; color: #b45309; }
  .ap-pill.active { background: #fef3c7; border-color: #d97706; color: #92400e; font-weight: 600; }
  .ap-pill-selected { font-size: 0.7rem; color: #b45309; font-weight: 600; margin-left: 0.5rem; }

  .ap-filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; gap: 0.75rem; align-items: end; }
  @media (max-width: 900px) { .ap-filter-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .ap-filter-grid { grid-template-columns: 1fr; } }

  .ap-search-wrap { position: relative; }
  .ap-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999999; font-size: 14px; pointer-events: none; }
  .ap-search-wrap .ap-input { padding-left: 2.25rem; }

  .ap-table { width: 100%; border-collapse: collapse; font-size: 0.855rem; }
  .ap-table thead { background: #f5f7fb; border-bottom: 2px solid #c6cbd6; }
  .ap-table th { padding: 0.75rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; color: #555555; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
  .ap-table th.sortable { cursor: pointer; user-select: none; }
  .ap-table th.sortable:hover { color: #b45309; }
  .ap-table td { padding: 0.85rem 1rem; color: #222222; border-bottom: 1px solid #e3e6ee; vertical-align: middle; }
  .ap-table tbody tr:hover td { background: #f5f7fb; }
  .ap-table tbody tr:last-child td { border-bottom: none; }
  .ap-table .td-name { font-weight: 600; color: #222222; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ap-table .td-price { font-weight: 700; color: #b45309; font-variant-numeric: tabular-nums; }
  .ap-table .td-muted { color: #7f7f7f; font-size: 0.8rem; }

  .ap-badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 3px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  .ap-badge.active { background: #dcfce7; color: #15803d; }
  .ap-badge.inactive { background: #f5f7fb; color: #7f7f7f; }
  .ap-badge.watch { background: #eff6ff; color: #1d4ed8; }
  .ap-badge.diamond { background: #fdf4ff; color: #7e22ce; }
  .ap-badge.memo-on { background: #fef3c7; color: #92400e; cursor: pointer; border: none; font-family: Verdana, Geneva, Tahoma, sans-serif; }
  .ap-badge.memo-on:hover { background: #fde68a; }
  .ap-badge.memo-off { background: #f5f7fb; color: #999999; cursor: pointer; border: none; font-family: Verdana, Geneva, Tahoma, sans-serif; }
  .ap-badge.memo-off:hover { background: #e3e6ee; color: #7f7f7f; }

  .ap-row-actions { display: flex; align-items: center; gap: 6px; }
  .ap-deactivate { font-size: 0.75rem; color: #999999; background: none; border: none; cursor: pointer; font-family: Verdana, Geneva, Tahoma, sans-serif; padding: 4px 8px; border-radius: 3px; transition: all 0.15s; white-space: nowrap; }
  .ap-deactivate:hover { color: #d97706; background: #fef3c7; }
  .ap-reactivate { font-size: 0.75rem; color: #15803d; background: none; border: none; cursor: pointer; font-family: Verdana, Geneva, Tahoma, sans-serif; padding: 4px 8px; border-radius: 3px; transition: all 0.15s; white-space: nowrap; }
  .ap-reactivate:hover { color: #15803d; background: #dcfce7; }
  .ap-delete-row { font-size: 0.75rem; color: #999999; background: none; border: none; cursor: pointer; font-family: Verdana, Geneva, Tahoma, sans-serif; padding: 4px 8px; border-radius: 3px; transition: all 0.15s; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .ap-delete-row:hover { color: #dc2626; background: #fef2f2; }

  .ap-filter-summary { display: flex; align-items: center; justify-content: space-between; margin-top: 0.875rem; padding-top: 0.875rem; border-top: 1px solid #c6cbd6; }
  .ap-filter-count { font-size: 0.8rem; color: #555555; }
  .ap-filter-count strong { color: #222222; }
  .ap-clear-btn { font-size: 0.78rem; color: #b45309; background: none; border: none; cursor: pointer; font-family: Verdana, Geneva, Tahoma, sans-serif; font-weight: 600; padding: 0; }
  .ap-clear-btn:hover { color: #92400e; text-decoration: underline; }

  .ap-pagination { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-top: 1px solid #c6cbd6; }
  .ap-page-info { font-size: 0.78rem; color: #7f7f7f; }
  .ap-page-btns { display: flex; gap: 4px; }
  .ap-page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #a6aec5; border-radius: 3px; font-size: 0.78rem; font-weight: 500; color: #555555; background: #fff; cursor: pointer; transition: all 0.12s; font-family: Verdana, Geneva, Tahoma, sans-serif; }
  .ap-page-btn:hover:not(:disabled) { border-color: #b45309; color: #b45309; }
  .ap-page-btn.current { background: #1c4874; border-color: #1c4874; color: #fff; font-weight: 700; }
  .ap-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .ap-empty { text-align: center; padding: 4rem 1rem; }
  .ap-empty-icon { font-size: 2rem; margin-bottom: 0.75rem; }
  .ap-empty-title { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 1.1rem; color: #222222; margin-bottom: 0.4rem; }
  .ap-empty-sub { font-size: 0.85rem; color: #7f7f7f; }

  .ap-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 3px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #15803d; font-weight: 500; margin-bottom: 1rem; }
  .ap-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 3px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #dc2626; font-weight: 500; }

  .ap-table-wrap { overflow-x: auto; }

  .ap-topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
  .ap-topbar-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

  .ap-form-outer { margin-bottom: 1.5rem; }

  .ap-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.875rem; margin-bottom: 1.5rem; }
  .ap-stat { background: #fff; border: 1px solid #c6cbd6; border-radius: 3px; padding: 1rem 1.25rem; }
  .ap-stat-label { font-size: 0.7rem; font-weight: 700; color: #7f7f7f; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 0.35rem; }
  .ap-stat-value { font-size: 1.5rem; font-weight: 700; color: #222222; font-variant-numeric: tabular-nums; line-height: 1; }
  .ap-stat-value.amber { color: #b45309; }
  .ap-stat-value.green { color: #15803d; }

  .ap-modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(15,23,42,0.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 1rem; animation: ap-fade-in 0.15s ease; }
  @keyframes ap-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .ap-modal { background: #fff; border-radius: 3px; padding: 2rem; max-width: 420px; width: 100%; box-shadow: 0 24px 48px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.08); animation: ap-slide-up 0.18s ease; }
  @keyframes ap-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .ap-modal-icon { width: 48px; height: 48px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 1.25rem; }
  .ap-modal-title { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 1.15rem; color: #222222; margin: 0 0 0.5rem; }
  .ap-modal-body { font-size: 0.875rem; color: #555555; line-height: 1.6; margin: 0 0 1.5rem; }
  .ap-modal-body strong { color: #dc2626; }
  .ap-modal-input-wrap { margin-bottom: 1.25rem; }
  .ap-modal-input-label { display: block; font-size: 0.72rem; font-weight: 600; color: #555555; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 0.4rem; }
  .ap-modal-confirm-input { width: 100%; height: 38px; padding: 0 0.75rem; border: 1.5px solid #a6aec5; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.875rem; color: #222222; background: #f5f7fb; outline: none; transition: border-color 0.15s; }
  .ap-modal-confirm-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
  .ap-modal-actions { display: flex; gap: 0.625rem; }
  .ap-modal-cancel { flex: 1; height: 40px; background: #f5f7fb; border: 1.5px solid #a6aec5; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.825rem; font-weight: 500; color: #555555; cursor: pointer; transition: all 0.15s; }
  .ap-modal-cancel:hover { border-color: #a6aec5; background: #eef0f5; }
  .ap-modal-confirm-btn { flex: 1; height: 40px; background: #dc2626; border: none; border-radius: 3px; font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 0.825rem; font-weight: 600; color: #fff; cursor: pointer; transition: background 0.15s; }
  .ap-modal-confirm-btn:hover { background: #b91c1c; }
  .ap-modal-confirm-btn:disabled { background: #fca5a5; cursor: not-allowed; }

  /* ── Image Uploader ── */
  .ap-uploader { grid-column: span 2; }
  .ap-drop-zone { border: 2px dashed #a6aec5; border-radius: 3px; background: #f5f7fb; padding: 1.5rem 1rem; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; position: relative; }
  .ap-drop-zone:hover, .ap-drop-zone.drag-over { border-color: #b45309; background: #fffbeb; }
  .ap-drop-zone input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .ap-drop-icon { font-size: 1.6rem; margin-bottom: 0.4rem; }
  .ap-drop-text { font-size: 0.85rem; color: #7f7f7f; }
  .ap-drop-text strong { color: #b45309; }
  .ap-drop-hint { font-size: 0.72rem; color: #999999; margin-top: 0.25rem; }

  .ap-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; margin-top: 0.75rem; }
  .ap-img-thumb { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; border: 1.5px solid #c6cbd6; background: #eef0f5; }
  .ap-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ap-img-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(15,23,42,0.7); border: none; color: #fff; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.12s; line-height: 1; }
  .ap-img-remove:hover { background: #dc2626; }
  .ap-img-uploading { position: absolute; inset: 0; background: rgba(255,255,255,0.75); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #b45309; flex-direction: column; gap: 4px; }
  .ap-img-spinner { width: 18px; height: 18px; border: 2px solid #fde68a; border-top-color: #b45309; border-radius: 50%; animation: ap-spin 0.7s linear infinite; }
  @keyframes ap-spin { to { transform: rotate(360deg); } }
  .ap-upload-error { font-size: 0.72rem; color: #dc2626; margin-top: 0.35rem; }
  .ap-uploading-bar { height: 3px; background: #fde68a; border-radius: 2px; margin-top: 0.5rem; overflow: hidden; }
  .ap-uploading-bar-inner { height: 100%; background: #b45309; border-radius: 2px; animation: ap-bar 1.2s ease-in-out infinite; }
  @keyframes ap-bar { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }

  /* ── Classic storefront density & accents (overrides the rules above) ── */
  .ap-root { background: #fff; padding: 0; min-height: 0; font-size: 11px; }
  .ap-breadcrumb { font-size: 10px; text-transform: none; letter-spacing: 0; }
  .ap-breadcrumb:hover, .ap-clear-btn, .ap-pill-selected { color: #1c4874; }
  .ap-clear-btn:hover { color: #154273; }
  .ap-topbar { margin-bottom: 12px; align-items: center; }
  .ap-card { border-color: #a6aec5; }
  .ap-card-inner { padding: 10px 12px; }
  .ap-section-title { font-size: 13px; color: #1c4874; margin-bottom: 10px; padding-bottom: 6px; }
  .ap-label { font-size: 10px; letter-spacing: 0; margin-bottom: 2px; color: #555; }
  .ap-input { height: 24px; padding: 0 6px; border: 1px solid #7f8aa8; font-size: 11px; background: #fff; }
  .ap-input:focus { border-color: #1c4874; box-shadow: none; outline: 2px solid #1c4874; outline-offset: 0; }
  .ap-textarea { padding: 4px 6px; }
  .ap-search-wrap .ap-input { padding-left: 24px; }
  .ap-search-icon { left: 7px; font-size: 12px; }
  .ap-filter-grid { gap: 6px 8px; }
  .ap-filter-summary { margin-top: 8px; padding-top: 8px; }
  .ap-filter-count { font-size: 11px; }

  .ap-btn-primary, .ap-btn-ghost, .ap-btn-danger, .ap-btn-success {
    height: 26px; padding: 0 12px; font-size: 11px; font-weight: bold; letter-spacing: 0; border-width: 1px;
  }
  .ap-btn-primary, .ap-btn-primary.full { background: #1c4874; border: 1px solid #154273; }
  .ap-btn-primary:hover, .ap-btn-primary.full:hover { background: #154273; }
  .ap-btn-primary:active { transform: none; }
  .ap-btn-primary.full { height: 30px; font-size: 12px; }
  .ap-btn-ghost { background: #ccd6e3; border: 1px solid #7f8aa8; color: #333; }
  .ap-btn-ghost:hover { background: #b8c5d8; border-color: #7f8aa8; color: #000; }
  .ap-btn-danger { background: #fff; border-color: #e0a3a3; color: #990000; }
  .ap-btn-danger:hover { background: #fdf0f0; border-color: #990000; }

  .ap-type-toggle { background: #dfe2ea; padding: 3px; gap: 3px; margin-bottom: 12px; }
  .ap-type-btn { height: 26px; font-size: 11px; }
  .ap-type-btn.active { box-shadow: 0 0 0 1px #a6aec5; color: #1c4874; }
  .ap-type-btn:hover:not(.active) { color: #1c4874; }
  .ap-form-grid { gap: 8px 12px; }
  .ap-subsection { margin-top: 2px; padding-top: 8px; }
  .ap-subsection-title { font-size: 10px; letter-spacing: 0; margin-bottom: 6px; color: #1c4874; }
  .ap-pill-wrap { padding: 6px; border-width: 1px; gap: 4px; }
  .ap-pill { padding: 2px 8px; font-size: 10px; border-width: 1px; }
  .ap-pill:hover { border-color: #1c4874; color: #1c4874; }
  .ap-pill.active { background: #1c4874; border-color: #1c4874; color: #fff; }

  .ap-stats { gap: 0; margin-bottom: 12px; border: 1px solid #a6aec5; }
  .ap-stat { border: 0; border-left: 1px solid #e3e6ee; padding: 8px 12px; }
  .ap-stat:first-child { border-left: 0; }
  .ap-stat-label { font-size: 10px; letter-spacing: 0; text-transform: none; font-weight: normal; }
  .ap-stat-value { font-size: 20px; color: #1c4874; }
  .ap-stat-value.amber { color: #1c4874; }
  .ap-stat-value.green { color: #2d7a52; }

  .ap-table { font-size: 11px; }
  .ap-table thead { background: linear-gradient(to bottom, #b7c0da 0, #ccd3e6 100%); border-bottom: 0; }
  .ap-table th { padding: 4px 8px; font-size: 10px; color: #000; letter-spacing: 0; text-transform: none; border-left: 1px solid #fff; }
  .ap-table th:first-child { border-left: 0; }
  .ap-table th.sortable:hover { color: #1c4874; text-decoration: underline; }
  .ap-table td { padding: 6px 8px; border-bottom-color: #eee; }
  .ap-table .td-name { color: #003366; }
  .ap-table .td-price { color: #1c4874; }
  .ap-table .td-muted { font-size: 11px; }
  .ap-badge { padding: 1px 6px; font-size: 10px; letter-spacing: 0; }
  .ap-badge.memo-on { background: #eef2f8; color: #1c4874; border: 1px solid #a6aec5; }
  .ap-badge.memo-on:hover { background: #dfe2ea; }
  .ap-deactivate, .ap-reactivate, .ap-delete-row { font-size: 10px; padding: 2px 6px; text-decoration: underline; }
  .ap-deactivate:hover { color: #1c4874; background: #eef2f8; }

  .ap-pagination { padding: 6px 8px; }
  .ap-page-info { font-size: 10px; }
  .ap-page-btn { width: 24px; height: 22px; font-size: 10px; border-width: 1px; }
  .ap-page-btn:hover:not(:disabled) { border-color: #1c4874; color: #1c4874; }
  .ap-empty { padding: 30px 12px; }
  .ap-success, .ap-error { padding: 6px 10px; font-size: 11px; }

`;

/* ── Interfaces ───────────────────────────────────────────────────────────── */
interface Product {
  _id: string;
  name: string;
  price: number;
  shape: string | string[];
  size: number;
  color: string | string[];
  clarity: string | string[];
  stock: number;
  isActive: boolean;
  category?: { _id: string; name: string } | string;
  watchBrand?: string;
  watchMovement?: string;
  watchGender?: string;
  memoEligible?: boolean;
  memoMinDays?: number;
  memoMaxDays?: number;
  reservedForMemo?: number;
}
interface Category {
  _id: string;
  name: string;
  subcategories: Subcategory[];
}
interface Subcategory {
  _id: string;
  name: string;
  category: string;
}
interface SubSubcategory {
  _id: string;
  name: string;
  subcategory: { _id: string; name: string } | string;
}

type ProductType = "diamond" | "watch";

const EMPTY_DIAMOND_FORM = {
  productType: "diamond" as ProductType,
  name: "",
  category: "",
  subcategory: "",
  subSubcategory: "",
  price: "",
  shapes: [] as string[],
  size: "",
  colors: [] as string[],
  clarities: [] as string[],
  certifications: [] as string[],
  approxWeight: "",
  numberOfStones: "",
  stock: "",
  description: "",
  memoEligible: false,
  memoMinDays: "3",
  memoMaxDays: "14",
};

const EMPTY_WATCH_FORM = {
  productType: "watch" as ProductType,
  name: "",
  category: "",
  subcategory: "",
  subSubcategory: "",
  price: "",
  stock: "",
  description: "",
  watchGender: "",
  watchBrand: "",
  watchMovement: "",
  watchStrapType: "",
  watchCaseMaterial: "",
  watchDialColor: "",
  watchFeatures: [] as string[],
  watchStyle: "",
  watchCaseSize: "",
  memoEligible: false,
  memoMinDays: "3",
  memoMaxDays: "14",
};

type DiamondForm = typeof EMPTY_DIAMOND_FORM;
type WatchForm = typeof EMPTY_WATCH_FORM;

/* ── ConfirmModal ─────────────────────────────────────────────────────────── */
function ConfirmDeleteModal({
  mode, productName, totalCount, error, onConfirm, onCancel, loading,
}: {
  mode: "single" | "all" | "filtered" | "reactivateFiltered";
  productName?: string;
  totalCount?: number;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const required = mode === "all" ? "DELETE ALL" : mode === "filtered" ? "DEACTIVATE" : mode === "reactivateFiltered" ? "REACTIVATE" : "";
  const canConfirm = mode === "single" || confirmText === required;

  return (
    <div className="ap-modal-backdrop" onClick={onCancel}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-icon">{mode === "reactivateFiltered" ? "♻" : "🗑"}</div>
        {mode === "all" ? (
          <>
            <h2 className="ap-modal-title">Delete All Products</h2>
            <p className="ap-modal-body">
              This will permanently delete{" "}
              <strong>all {totalCount} products</strong> from the catalogue. This action{" "}
              <strong>cannot be undone</strong>.
            </p>
            <div className="ap-modal-input-wrap">
              <label className="ap-modal-input-label">
                Type <strong>DELETE ALL</strong> to confirm
              </label>
              <input
                className="ap-modal-confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE ALL"
                autoFocus
              />
            </div>
          </>
        ) : mode === "filtered" ? (
          <>
            <h2 className="ap-modal-title">Delete Filtered Products</h2>
            <p className="ap-modal-body">
              This will deactivate <strong>{totalCount} product{totalCount === 1 ? "" : "s"}</strong>{" "}
              matching your current filter — the same set shown in the table right now. Deactivated
              products stop showing on the storefront but stay in the catalogue, so this{" "}
              <strong>can be undone</strong> by reactivating them individually (unlike &quot;Delete All&quot;
              above, this does not remove any records).
            </p>
            <div className="ap-modal-input-wrap">
              <label className="ap-modal-input-label">
                Type <strong>DEACTIVATE</strong> to confirm
              </label>
              <input
                className="ap-modal-confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DEACTIVATE"
                autoFocus
              />
            </div>
            {error && <p className="ap-modal-body" style={{ color: "#b91c1c" }}>⚠ {error}</p>}
          </>
        ) : mode === "reactivateFiltered" ? (
          <>
            <h2 className="ap-modal-title">Reactivate Filtered Products</h2>
            <p className="ap-modal-body">
              This will reactivate <strong>{totalCount} product{totalCount === 1 ? "" : "s"}</strong>{" "}
              matching your current filter — the same set shown in the table right now. Reactivated
              products immediately become visible on the storefront again.
            </p>
            <div className="ap-modal-input-wrap">
              <label className="ap-modal-input-label">
                Type <strong>REACTIVATE</strong> to confirm
              </label>
              <input
                className="ap-modal-confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="REACTIVATE"
                autoFocus
              />
            </div>
            {error && <p className="ap-modal-body" style={{ color: "#b91c1c" }}>⚠ {error}</p>}
          </>
        ) : (
          <>
            <h2 className="ap-modal-title">Delete Product</h2>
            <p className="ap-modal-body">
              Permanently delete{" "}
              <strong style={{ color: "#222222" }}>{productName}</strong>? This action{" "}
              <strong>cannot be undone</strong>.
            </p>
          </>
        )}
        <div className="ap-modal-actions">
          <button className="ap-modal-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="ap-modal-confirm-btn"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
          >
            {loading
              ? (mode === "filtered" ? "Deactivating…" : mode === "reactivateFiltered" ? "Reactivating…" : "Deleting…")
              : mode === "all" ? "Delete All Products"
              : mode === "filtered" ? "Deactivate Products"
              : mode === "reactivateFiltered" ? "Reactivate Products"
              : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MemoSettingsModal ────────────────────────────────────────────────────── */
function MemoSettingsModal({
  product, onSave, onCancel, loading, error,
}: {
  product: Product;
  onSave: (patch: { memoEligible: boolean; memoMinDays?: number; memoMaxDays?: number }) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [eligible, setEligible] = useState(!!product.memoEligible);
  const [minDays, setMinDays] = useState(String(product.memoMinDays ?? 3));
  const [maxDays, setMaxDays] = useState(String(product.memoMaxDays ?? MEMO_MAX_DAYS_CEILING));
  const [localError, setLocalError] = useState("");

  const submit = () => {
    setLocalError("");
    if (eligible) {
      const minD = Number(minDays);
      const maxD = Number(maxDays);
      if (!minD || minD < 1) { setLocalError("Min days must be at least 1"); return; }
      if (!maxD || maxD < 1) { setLocalError("Max days must be at least 1"); return; }
      if (maxD > MEMO_MAX_DAYS_CEILING) { setLocalError(`Max days cannot exceed ${MEMO_MAX_DAYS_CEILING}`); return; }
      if (maxD < minD) { setLocalError("Max days must be ≥ min days"); return; }
      onSave({ memoEligible: true, memoMinDays: minD, memoMaxDays: maxD });
    } else {
      onSave({ memoEligible: false });
    }
  };

  return (
    <div className="ap-modal-backdrop" onClick={onCancel}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-icon" style={{ background: "#fef3c7" }}>📋</div>
        <h2 className="ap-modal-title">Memo Settings</h2>
        <p className="ap-modal-body">
          Control whether <strong style={{ color: "#222222" }}>{product.name}</strong>{" "}
          can be requested by trade customers on memo.
          {typeof product.reservedForMemo === "number" && product.reservedForMemo > 0 && (
            <>
              {" "}
              <strong style={{ color: "#b45309" }}>
                {product.reservedForMemo} unit(s) currently out on memo.
              </strong>
            </>
          )}
        </p>

        <div className="ap-modal-input-wrap">
          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={eligible}
              onChange={(e) => setEligible(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#b45309" }}
            />
            <span className="ap-modal-input-label" style={{ marginBottom: 0 }}>
              Memo-eligible product
            </span>
          </label>
        </div>

        {eligible && (
          <div className="ap-modal-input-wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="ap-modal-input-label">Min Days</label>
              <input
                type="number"
                className="ap-modal-confirm-input"
                value={minDays}
                min={1}
                max={MEMO_MAX_DAYS_CEILING}
                onChange={(e) => setMinDays(e.target.value)}
              />
            </div>
            <div>
              <label className="ap-modal-input-label">
                Max Days <span className="ap-label-hint">≤ {MEMO_MAX_DAYS_CEILING}</span>
              </label>
              <input
                type="number"
                className="ap-modal-confirm-input"
                value={maxDays}
                min={1}
                max={MEMO_MAX_DAYS_CEILING}
                onChange={(e) => setMaxDays(e.target.value)}
              />
            </div>
          </div>
        )}

        {(localError || error) && (
          <p style={{ fontSize: "0.78rem", color: "#dc2626", marginBottom: "1rem" }}>⚠ {localError || error}</p>
        )}

        <div className="ap-modal-actions">
          <button className="ap-modal-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="ap-modal-confirm-btn"
            style={{ background: "#b45309" }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save Memo Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PillGroup ────────────────────────────────────────────────────────────── */
function PillGroup({
  options, selected, onChange, label, required,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (val: string[]) => void;
  label: string;
  required?: boolean;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  return (
    <div className="ap-col-2">
      <label className="ap-label">
        {label}{required && " *"}
        {selected.length > 0 && (
          <span className="ap-pill-selected">{selected.join(", ")}</span>
        )}
      </label>
      <div className="ap-pill-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`ap-pill${selected.includes(opt) ? " active" : ""}`}
          >
            {selected.includes(opt) ? "✓ " : ""}{opt}
          </button>
        ))}
      </div>
      {required && selected.length === 0 && (
        <p style={{ fontSize: "0.72rem", color: "#dc2626", marginTop: "0.35rem" }}>
          Select at least one
        </p>
      )}
    </div>
  );
}

/* ── ImageUploadItem ──────────────────────────────────────────────────────── */
interface UploadItem {
  id: string;           // local stable key
  previewUrl: string;   // object URL for instant preview
  cloudUrl: string | null;  // Cloudinary URL once uploaded
  status: "uploading" | "done" | "error";
  errorMsg?: string;
}

/* ── ImageUploader ────────────────────────────────────────────────────────── */
function ImageUploader({
  items,
  onChange,
  apiFetch,
}: {
  items: UploadItem[];
  onChange: (items: UploadItem[] | ((prev: UploadItem[]) => UploadItem[])) => void;  // ← updated
  apiFetch: (url: string, opts?: RequestInit) => Promise<unknown>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!fileArr.length) return;

    // Create placeholder items immediately so previews appear right away
    const newItems: UploadItem[] = fileArr.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      previewUrl: URL.createObjectURL(f),
      cloudUrl: null,
      status: "uploading" as const,
    }));

    onChange([...items, ...newItems]);

    // Upload all files in one multipart request
    const fd = new FormData();
    fileArr.forEach((f) => fd.append("files", f));

    try {
      const res = await apiFetch("/api/admin/upload", { method: "POST", body: fd }) as {
        urls: string[];
      };

      onChange((prev: UploadItem[]) =>
        prev.map((item) => {
          const idx = newItems.findIndex((n) => n.id === item.id);
          if (idx === -1) return item;
          return { ...item, cloudUrl: res.urls[idx], status: "done" as const };
        })
      );
    } catch (err) {
      onChange((prev: UploadItem[]) =>
        prev.map((item) =>
          newItems.find((n) => n.id === item.id)
            ? { ...item, status: "error" as const, errorMsg: err instanceof Error ? err.message : "Upload failed" }
            : item
        )
      );
    }
  };

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="ap-uploader">
      <label className="ap-label">
        Product Images
        <span className="ap-label-hint">JPG, PNG, WebP · up to 10 MB each</span>
      </label>

      {/* Drop zone */}
      <div
        className={`ap-drop-zone${dragOver ? " drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }}
        />
        <div className="ap-drop-icon">🖼</div>
        <div className="ap-drop-text">
          <strong>Click to browse</strong> or drag &amp; drop images here
        </div>
        <div className="ap-drop-hint">Multiple files supported</div>
      </div>

      {/* Uploading progress bar */}
      {items.some((i) => i.status === "uploading") && (
        <div className="ap-uploading-bar">
          <div className="ap-uploading-bar-inner" />
        </div>
      )}

      {/* Thumbnails */}
      {items.length > 0 && (
        <div className="ap-img-grid">
          {items.map((item) => (
            <div key={item.id} className="ap-img-thumb">
              <img src={item.previewUrl} alt="" />
              {item.status === "uploading" && (
                <div className="ap-img-uploading">
                  <div className="ap-img-spinner" />
                  <span>Uploading…</span>
                </div>
              )}
              {item.status === "error" && (
                <div className="ap-img-uploading" style={{ background: "rgba(254,242,242,0.9)", color: "#dc2626" }}>
                  <span>✕ Failed</span>
                </div>
              )}
              <button
                type="button"
                className="ap-img-remove"
                onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Per-item errors */}
      {items.filter((i) => i.status === "error").map((i) => (
        <div key={i.id} className="ap-upload-error">
          ⚠ {i.errorMsg ?? "Upload failed for one image"}
        </div>
      ))}
    </div>
  );
}

type SortKey = "name" | "price" | "stock";
type SortDir = "asc" | "desc";

/* ── AddProductForm ───────────────────────────────────────────────────────── */
function AddProductForm({
  categories,
  onSuccess,
  onCancel,
  apiFetch,
}: {
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
  apiFetch: (url: string, opts?: RequestInit) => Promise<unknown>;
}) {
  const [productType, setProductType] = useState<ProductType>("diamond");
  const [diamondForm, setDiamondForm] = useState<DiamondForm>({ ...EMPTY_DIAMOND_FORM });
  const [watchForm, setWatchForm] = useState<WatchForm>({ ...EMPTY_WATCH_FORM });
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<SubSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = productType === "diamond" ? diamondForm : watchForm;

  const handleCategoryChange = (id: string) => {
    if (productType === "diamond") {
      setDiamondForm((prev) => ({ ...prev, category: id, subcategory: "", subSubcategory: "" }));
    } else {
      setWatchForm((prev) => ({ ...prev, category: id, subcategory: "", subSubcategory: "" }));
    }
    setSubcategories(categories.find((c) => c._id === id)?.subcategories ?? []);
    setSubSubcategories([]);
  };

  const handleSubcategoryChange = (id: string) => {
    setField("subcategory", id);
    setField("subSubcategory", "");
    setSubSubcategories([]);
    if (!id) return;
    apiFetch(`/api/admin/subsubcategories?subcategory=${id}`)
      .then((res) => setSubSubcategories(((res as { data?: SubSubcategory[] }).data) ?? []))
      .catch(() => setSubSubcategories([]));
  };

  const setField = (key: string, value: string) => {
    if (productType === "diamond") {
      setDiamondForm((prev) => ({ ...prev, [key]: value }));
    } else {
      setWatchForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Block submit if any image is still uploading
    if (uploadItems.some((i) => i.status === "uploading")) {
      setError("Please wait for all images to finish uploading.");
      return;
    }

    if (productType === "diamond") {
      if (diamondForm.shapes.length === 0) { setError("Select at least one shape"); return; }
      if (diamondForm.colors.length === 0) { setError("Select at least one color"); return; }
      if (diamondForm.clarities.length === 0) { setError("Select at least one clarity"); return; }
    } else {
      if (!watchForm.watchBrand) { setError("Brand is required"); return; }
      if (!watchForm.watchMovement) { setError("Movement type is required"); return; }
    }

    // Memo window sanity check (mirrors server-side validation)
    if (form.memoEligible) {
      const minD = Number(form.memoMinDays);
      const maxD = Number(form.memoMaxDays);
      if (!minD || minD < 1) { setError("Memo minimum days must be at least 1"); return; }
      if (!maxD || maxD < 1) { setError("Memo maximum days must be at least 1"); return; }
      if (maxD > MEMO_MAX_DAYS_CEILING) { setError(`Memo maximum days cannot exceed ${MEMO_MAX_DAYS_CEILING}`); return; }
      if (maxD < minD) { setError("Memo maximum days must be ≥ minimum days"); return; }
    }

    // Collect successfully uploaded Cloudinary URLs
    const imageUrls = uploadItems
      .filter((i) => i.status === "done" && i.cloudUrl)
      .map((i) => i.cloudUrl as string);

    setLoading(true);
    try {
      let payload: Record<string, unknown>;

            if (productType === "diamond") {
        const { shapes, colors, clarities, certifications, numberOfStones, productType: _pt, memoEligible, memoMinDays, memoMaxDays, ...rest } = diamondForm;
        payload = {
          productType: "diamond",
          ...rest,
          price: Number(diamondForm.price),
          size: Number(diamondForm.size),
          stock: Number(diamondForm.stock),
          shape: shapes,
          color: colors,
          clarity: clarities,
          certification: certifications,
          images: imageUrls,
          memoEligible,
          ...(numberOfStones !== "" ? { numberOfStones: Number(numberOfStones) } : {}),
          ...(memoEligible
            ? { memoMinDays: Number(memoMinDays), memoMaxDays: Number(memoMaxDays) }
            : {}),
        };
        if (payload.approxWeight === "") delete payload.approxWeight;
        if (payload.subSubcategory === "") delete payload.subSubcategory;
      } else {
        const { productType: _pt, watchFeatures, memoEligible, memoMinDays, memoMaxDays, ...rest } = watchForm;
        payload = {
          productType: "watch",
          ...rest,
          price: Number(watchForm.price),
          stock: Number(watchForm.stock),
          watchFeatures,
          images: imageUrls,
          memoEligible,
          ...(memoEligible
            ? { memoMinDays: Number(memoMinDays), memoMaxDays: Number(memoMaxDays) }
            : {}),
        };
        Object.keys(payload).forEach((k) => {
          if (payload[k] === "") delete payload[k];
        });
      }

      await apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
      setDiamondForm({ ...EMPTY_DIAMOND_FORM });
      setWatchForm({ ...EMPTY_WATCH_FORM });
      setUploadItems([]);
      setSubcategories([]);
      setSubSubcategories([]);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const selectedCatName = categories.find((c) => c._id === form.category)?.name ?? "";
  const isUploading = uploadItems.some((i) => i.status === "uploading");

  return (
    <div className="ap-form-outer">
      <div className="ap-card">
        <div className="ap-card-inner">
          <h2 className="ap-section-title">New Product</h2>

          {/* Product type toggle */}
          <div className="ap-type-toggle">
            <button
              type="button"
              className={`ap-type-btn${productType === "diamond" ? " active" : ""}`}
              onClick={() => setProductType("diamond")}
            >
              💎 Diamond / Gemstone
            </button>
            <button
              type="button"
              className={`ap-type-btn${productType === "watch" ? " active" : ""}`}
              onClick={() => setProductType("watch")}
            >
              ⌚ Watch
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ap-form-grid">

              {/* ── Shared fields ── */}
              <div className="ap-col-2">
                <label className="ap-label">Product Name *</label>
                <input
                  className="ap-input"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder={
                    productType === "diamond"
                      ? "e.g. 1.5ct Round Brilliant Diamond"
                      : "e.g. Rolex Submariner Date 41mm"
                  }
                  required
                />
              </div>

              <div>
                <label className="ap-label">
                  Category *
                  <span className="ap-label-hint">({categories.length} categories)</span>
                </label>
                <select
                  className="ap-input"
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ap-label">
                  Subcategory
                  {form.category && (
                    <span className="ap-label-hint">
                      {subcategories.length} in {selectedCatName}
                    </span>
                  )}
                </label>
                <select
                  className="ap-input"
                  value={form.subcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  disabled={!form.category}
                >
                  <option value="">
                    {!form.category
                      ? "Select category first"
                      : subcategories.length === 0
                        ? "No subcategories"
                        : "Select subcategory…"}
                  </option>
                  {subcategories.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {subSubcategories.length > 0 && (
                <div>
                  <label className="ap-label">
                    Type
                    <span className="ap-label-hint">
                      {subSubcategories.length} under {subcategories.find((s) => s._id === form.subcategory)?.name}
                    </span>
                  </label>
                  <select
                    className="ap-input"
                    value={form.subSubcategory}
                    onChange={(e) => setField("subSubcategory", e.target.value)}
                  >
                    <option value="">Select type… (optional)</option>
                    {subSubcategories.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="ap-label">Price (USD) *</label>
                <input
                  type="number"
                  className="ap-input"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="ap-label">Stock Quantity *</label>
                <input
                  type="number"
                  className="ap-input"
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                  placeholder="0"
                  required
                  min="0"
                />
              </div>

              {/* ── Diamond-specific fields ── */}
              {productType === "diamond" && (
                <>
                                    <div>
                    <label className="ap-label">Size (Carat) *</label>
                    <input
                      type="number"
                      className="ap-input"
                      value={(diamondForm as DiamondForm).size}
                      onChange={(e) =>
                        setDiamondForm((prev) => ({ ...prev, size: e.target.value }))
                      }
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="ap-label">Approx Weight</label>
                    <input
                      className="ap-input"
                      value={(diamondForm as DiamondForm).approxWeight}
                      onChange={(e) =>
                        setDiamondForm((prev) => ({ ...prev, approxWeight: e.target.value }))
                      }
                      placeholder="e.g. 5.00 - 10.00 ct"
                    />
                  </div>

                  <div>
                    <label className="ap-label">Number Of Stones</label>
                    <input
                      type="number"
                      className="ap-input"
                      value={(diamondForm as DiamondForm).numberOfStones}
                      onChange={(e) =>
                        setDiamondForm((prev) => ({ ...prev, numberOfStones: e.target.value }))
                      }
                      placeholder="e.g. 12"
                      min="0"
                      step="1"
                    />
                  </div>

                  <PillGroup
                    label="Shape"
                    options={SHAPES}
                    selected={(diamondForm as DiamondForm).shapes}
                    onChange={(v) => setDiamondForm((prev) => ({ ...prev, shapes: v }))}
                    required
                  />
                  <PillGroup
                    label="Color"
                    options={COLORS}
                    selected={(diamondForm as DiamondForm).colors}
                    onChange={(v) => setDiamondForm((prev) => ({ ...prev, colors: v }))}
                    required
                  />
                  <PillGroup
                    label="Clarity Grade"
                    options={CLARITIES}
                    selected={(diamondForm as DiamondForm).clarities}
                    onChange={(v) => setDiamondForm((prev) => ({ ...prev, clarities: v }))}
                    required
                  />
                  <PillGroup
                    label="Certification"
                    options={CERTIFICATIONS}
                    selected={(diamondForm as DiamondForm).certifications}
                    onChange={(v) => setDiamondForm((prev) => ({ ...prev, certifications: v }))}
                  />
                </>
              )}

              {/* ── Watch-specific fields ── */}
              {productType === "watch" && (
                <>
                  <div>
                    <label className="ap-label">Gender *</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchGender}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchGender: e.target.value }))}
                      required
                    >
                      <option value="">Select gender…</option>
                      {WATCH_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Brand *</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchBrand}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchBrand: e.target.value }))}
                      required
                    >
                      <option value="">Select brand…</option>
                      {WATCH_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Movement *</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchMovement}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchMovement: e.target.value }))}
                      required
                    >
                      <option value="">Select movement…</option>
                      {WATCH_MOVEMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Style</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchStyle}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchStyle: e.target.value }))}
                    >
                      <option value="">Select style…</option>
                      {WATCH_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Strap Type</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchStrapType}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchStrapType: e.target.value }))}
                    >
                      <option value="">Select strap…</option>
                      {WATCH_STRAP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Case Material</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchCaseMaterial}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchCaseMaterial: e.target.value }))}
                    >
                      <option value="">Select material…</option>
                      {WATCH_CASE_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Dial Color</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchDialColor}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchDialColor: e.target.value }))}
                    >
                      <option value="">Select dial color…</option>
                      {WATCH_DIAL_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="ap-label">Case Size</label>
                    <select
                      className="ap-input"
                      value={(watchForm as WatchForm).watchCaseSize}
                      onChange={(e) => setWatchForm((prev) => ({ ...prev, watchCaseSize: e.target.value }))}
                    >
                      <option value="">Select size…</option>
                      {WATCH_CASE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <PillGroup
                    label="Features"
                    options={WATCH_FEATURES}
                    selected={(watchForm as WatchForm).watchFeatures}
                    onChange={(v) => setWatchForm((prev) => ({ ...prev, watchFeatures: v }))}
                  />
                </>
              )}

              {/* ── Image uploader (replaces textarea) ── */}
              <ImageUploader
                items={uploadItems}
                onChange={setUploadItems}
                apiFetch={apiFetch}
              />

              {/* ── Memo settings ── */}
              <div className="ap-subsection">
                <div className="ap-subsection-title">Memo Program</div>
              </div>
              <div className="ap-col-2">
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.memoEligible}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (productType === "diamond") {
                        setDiamondForm((prev) => ({ ...prev, memoEligible: checked }));
                      } else {
                        setWatchForm((prev) => ({ ...prev, memoEligible: checked }));
                      }
                    }}
                    style={{ width: 16, height: 16, accentColor: "#b45309" }}
                  />
                  <span className="ap-label" style={{ marginBottom: 0 }}>
                    Allow this product to be requested on memo
                    <span className="ap-label-hint">Off by default — most SKUs should never be memo-eligible</span>
                  </span>
                </label>
              </div>

              {form.memoEligible && (
                <>
                  <div>
                    <label className="ap-label">Memo Min Days</label>
                    <input
                      type="number"
                      className="ap-input"
                      value={form.memoMinDays}
                      min={1}
                      max={MEMO_MAX_DAYS_CEILING}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (productType === "diamond") setDiamondForm((prev) => ({ ...prev, memoMinDays: v }));
                        else setWatchForm((prev) => ({ ...prev, memoMinDays: v }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="ap-label">
                      Memo Max Days
                      <span className="ap-label-hint">Ceiling: {MEMO_MAX_DAYS_CEILING} days</span>
                    </label>
                    <input
                      type="number"
                      className="ap-input"
                      value={form.memoMaxDays}
                      min={1}
                      max={MEMO_MAX_DAYS_CEILING}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (productType === "diamond") setDiamondForm((prev) => ({ ...prev, memoMaxDays: v }));
                        else setWatchForm((prev) => ({ ...prev, memoMaxDays: v }));
                      }}
                    />
                  </div>
                </>
              )}

              {/* ── Description ── */}
              <div className="ap-col-2">
                <label className="ap-label">Description</label>
                <textarea
                  className="ap-input ap-textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Optional product description…"
                />
              </div>

              {error && <div className="ap-col-2 ap-error">⚠ {error}</div>}

              <div className="ap-col-2" style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={onCancel}
                  className="ap-btn-ghost"
                  style={{ flex: "0 0 auto" }}
                >
                  ✕ Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isUploading}
                  className="ap-btn-primary full"
                  style={{ flex: 1 }}
                >
                  {isUploading
                    ? "⏳ Uploading images…"
                    : loading
                      ? "Saving…"
                      : productType === "diamond"
                        ? "💎 Create Diamond Product"
                        : "⌚ Create Watch Product"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AdminProductsPage() {
  const { apiFetch } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, memoEligible: 0, inventoryValue: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  // `search` is what's typed immediately; `debouncedSearch` is what's actually
  // sent to the server, 350ms after typing stops. With an 18k+ product
  // catalogue, firing a request on every keystroke would hammer the DB.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterShape, setFilterShape] = useState("");
  const [filterClarity, setFilterClarity] = useState("");
  const [filterMemo, setFilterMemo] = useState<"all" | "eligible" | "not">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [modal, setModal] = useState<
    | { mode: "all" }
    | { mode: "single"; id: string; name: string }
    | { mode: "filtered" }
    | { mode: "reactivateFiltered" }
    | null
  >(null);
  const [filteredDeleteError, setFilteredDeleteError] = useState("");
  const [filteredReactivateError, setFilteredReactivateError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const [memoModalProduct, setMemoModalProduct] = useState<Product | null>(null);
  const [memoModalLoading, setMemoModalLoading] = useState(false);
  const [memoModalError, setMemoModalError] = useState("");

  // Debounce the search box; reset to page 1 in the same state update so the
  // fetch effect only fires once per search change, not twice.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      if (filterCategory) params.set("category", filterCategory);
      if (filterSubcategory) params.set("subcategory", filterSubcategory);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterShape) params.set("shape", filterShape);
      if (filterClarity) params.set("clarity", filterClarity);
      if (filterMemo !== "all") params.set("memo", filterMemo);
      params.set("sortBy", sortKey);
      params.set("sortDir", sortDir);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const pData = await apiFetch(`/api/admin/products?${params.toString()}`) as {
        data: Product[];
        total: number;
        stats: typeof stats;
      };
      setProducts(pData.data || []);
      setTotal(pData.total || 0);
      if (pData.stats) setStats(pData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterCategory, filterSubcategory, filterStatus, filterShape, filterClarity, filterMemo, sortKey, sortDir, page]);

  // Subcategory options are scoped to whichever category is currently
  // selected — picking a category resets subcategory in the same state
  // update (see the category <select> onChange below) so the two can never
  // end up in an impossible combination.
  const subcategoryOptions = categories.find((c) => c._id === filterCategory)?.subcategories || [];

  useEffect(() => {
    (async () => {
      try {
        const cData = await apiFetch("/api/categories?withSubcategories=true");
        let cats: Category[] = [];
        const raw = cData as { data?: Category[] } | Category[];
        if (Array.isArray((raw as { data?: Category[] }).data)) cats = (raw as { data: Category[] }).data;
        else if (Array.isArray(raw)) cats = raw as Category[];
        setCategories(cats);
      } catch (err) {
        console.error(err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = products;

  const handleSort = (key: SortKey) => {
    setPage(1);
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };
  const SortArrow = ({ k }: { k: SortKey }) => (
    <span style={{ opacity: sortKey === k ? 1 : 0.3, marginLeft: 4 }}>
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const handleDeactivate = async (id: string) => {
    await apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleReactivate = async (id: string) => {
    await apiFetch(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: true }),
    });
    fetchProducts();
  };

  const handleDeleteSingle = async () => {
    if (modal?.mode !== "single") return;
    setModalLoading(true);
    try {
      await apiFetch(`/api/admin/products/${modal.id}`, { method: "DELETE" });
      setSuccess(`"${modal.name}" deleted successfully.`);
      setModal(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setModal(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    // NOTE: with a catalogue this large, bulk-deleting by looping individual
    // DELETE requests client-side is not viable — that path is intentionally
    // not attempted here. This now requires a real server-side bulk endpoint;
    // until one exists, this action is disabled (see button below).
    setModalLoading(true);
    try {
      await apiFetch("/api/admin/products", { method: "DELETE" });
      setSuccess(`All products deleted successfully.`);
      setModal(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete all products");
      setModal(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Deactivates every product matching the CURRENT filter bar — e.g.
  // category=Diamond + subcategory=Black Diamonds — via the dedicated
  // bulk-deactivate endpoint. This is a soft delete (isActive: false),
  // same as the existing single-product delete, and only ever runs
  // server-side with the same filter shown on screen (see
  // buildAdminProductQuery on the backend), so what's deactivated always
  // matches what was visible before confirming.
  const handleDeleteFiltered = async () => {
    setModalLoading(true);
    setFilteredDeleteError("");
    try {
      await apiFetch("/api/admin/products/bulk-deactivate", {
        method: "POST",
        body: JSON.stringify({
          q: debouncedSearch.trim() || undefined,
          category: filterCategory || undefined,
          subcategory: filterSubcategory || undefined,
          status: filterStatus,
          shape: filterShape || undefined,
          clarity: filterClarity || undefined,
          memo: filterMemo,
          confirm: true,
        }),
      });
      setSuccess(`Deactivated ${total} product(s) matching the current filter.`);
      setModal(null);
      setPage(1);
      fetchProducts();
    } catch (err) {
      setFilteredDeleteError(err instanceof Error ? err.message : "Failed to deactivate filtered products");
    } finally {
      setModalLoading(false);
    }
  };

  // Reactivates every product matching the CURRENT filter bar — mirror
  // image of handleDeleteFiltered above, via the dedicated
  // bulk-reactivate endpoint. Sets isActive back to true for the exact
  // same set of products shown in the table right now.
  const handleReactivateFiltered = async () => {
    setModalLoading(true);
    setFilteredReactivateError("");
    try {
      await apiFetch("/api/admin/products/bulk-reactivate", {
        method: "POST",
        body: JSON.stringify({
          q: debouncedSearch.trim() || undefined,
          category: filterCategory || undefined,
          subcategory: filterSubcategory || undefined,
          status: filterStatus,
          shape: filterShape || undefined,
          clarity: filterClarity || undefined,
          memo: filterMemo,
          confirm: true,
        }),
      });
      setSuccess(`Reactivated ${total} product(s) matching the current filter.`);
      setModal(null);
      setPage(1);
      fetchProducts();
    } catch (err) {
      setFilteredReactivateError(err instanceof Error ? err.message : "Failed to reactivate filtered products");
    } finally {
      setModalLoading(false);
    }
  };

  const handleMemoSave = async (patch: { memoEligible: boolean; memoMinDays?: number; memoMaxDays?: number }) => {
    if (!memoModalProduct) return;
    setMemoModalLoading(true);
    setMemoModalError("");
    try {
      await apiFetch(`/api/admin/products/${memoModalProduct._id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setSuccess(`Memo settings updated for "${memoModalProduct.name}".`);
      setMemoModalProduct(null);
      fetchProducts();
    } catch (err) {
      setMemoModalError(err instanceof Error ? err.message : "Failed to update memo settings");
    } finally {
      setMemoModalLoading(false);
    }
  };

  const hasFilters = !!(search || filterCategory || filterSubcategory || filterStatus !== "all" || filterShape || filterClarity || filterMemo !== "all");
  const isWatch = (p: Product) => !!(p.watchBrand || p.watchMovement || p.watchGender);

  return (
    <div className="ap-root">
      <style>{css}</style>

      {modal && (
        <ConfirmDeleteModal
          mode={modal.mode}
          productName={modal.mode === "single" ? modal.name : undefined}
          totalCount={modal.mode === "filtered" || modal.mode === "reactivateFiltered" ? total : stats.total}
          error={
            modal.mode === "filtered" ? filteredDeleteError
            : modal.mode === "reactivateFiltered" ? filteredReactivateError
            : undefined
          }
          onConfirm={
            modal.mode === "all" ? handleDeleteAll
            : modal.mode === "filtered" ? handleDeleteFiltered
            : modal.mode === "reactivateFiltered" ? handleReactivateFiltered
            : handleDeleteSingle
          }
          onCancel={() => { setModal(null); setFilteredDeleteError(""); setFilteredReactivateError(""); }}
          loading={modalLoading}
        />
      )}

      {memoModalProduct && (
        <MemoSettingsModal
          product={memoModalProduct}
          onSave={handleMemoSave}
          onCancel={() => { setMemoModalProduct(null); setMemoModalError(""); }}
          loading={memoModalLoading}
          error={memoModalError}
        />
      )}

      {/* Top bar */}
      <div className="ap-topbar">
        <div>
          <Link href="/admin" className="ap-breadcrumb">← Admin</Link>
          <h1 className="ap-display" style={{ marginTop: "0.35rem" }}>Product Catalogue</h1>
        </div>
        <div className="ap-topbar-actions">
          {stats.total > 0 && (
            <button className="ap-btn-danger" onClick={() => setModal({ mode: "all" })}>
              🗑 Delete All
            </button>
          )}
          <button
            className="ap-btn-primary"
            onClick={() => { setShowForm((v) => !v); setError(""); setSuccess(""); }}
          >
            {showForm ? "✕ Cancel" : "+ Add Product"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats">
        <div className="ap-stat">
          <div className="ap-stat-label">Total Products</div>
          <div className="ap-stat-value">{stats.total.toLocaleString()}</div>
        </div>
        <div className="ap-stat">
          <div className="ap-stat-label">Active</div>
          <div className="ap-stat-value green">{stats.active.toLocaleString()}</div>
        </div>
        <div className="ap-stat">
          <div className="ap-stat-label">Inactive</div>
          <div className="ap-stat-value">{stats.inactive.toLocaleString()}</div>
        </div>
        <div className="ap-stat">
          <div className="ap-stat-label">Inventory Value</div>
          <div className="ap-stat-value amber">${Math.round(stats.inventoryValue).toLocaleString()}</div>
        </div>
        <div className="ap-stat">
          <div className="ap-stat-label">Memo Eligible</div>
          <div className="ap-stat-value amber">{stats.memoEligible.toLocaleString()}</div>
        </div>
      </div>

      {success && <div className="ap-success">✓ {success}</div>}
      {error && !showForm && <div className="ap-error">⚠ {error}</div>}

      {showForm && (
        <AddProductForm
          categories={categories}
          apiFetch={apiFetch}
          onSuccess={() => {
            setSuccess("Product created successfully.");
            setShowForm(false);
            fetchProducts();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter bar */}
      <div className="ap-card" style={{ marginBottom: "1rem" }}>
        <div className="ap-card-inner" style={{ paddingBottom: hasFilters ? "0.75rem" : "1.75rem" }}>
          <div className="ap-filter-grid">
            <div className="ap-search-wrap">
              <span className="ap-search-icon">⌕</span>
              <input
                className="ap-input"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="ap-input"
              value={filterCategory}
              onChange={(e) => { setPage(1); setFilterCategory(e.target.value); setFilterSubcategory(""); }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select
              className="ap-input"
              value={filterSubcategory}
              onChange={(e) => { setPage(1); setFilterSubcategory(e.target.value); }}
              disabled={!filterCategory}
              title={!filterCategory ? "Select a category first" : undefined}
            >
              <option value="">
                {filterCategory ? "All Subcategories" : "Select a category first…"}
              </option>
              {subcategoryOptions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select className="ap-input" value={filterShape} onChange={(e) => { setPage(1); setFilterShape(e.target.value); }}>
              <option value="">All Shapes</option>
              {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="ap-input" value={filterClarity} onChange={(e) => { setPage(1); setFilterClarity(e.target.value); }}>
              <option value="">All Clarities</option>
              {CLARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="ap-input"
              value={filterStatus}
              onChange={(e) => { setPage(1); setFilterStatus(e.target.value as "all" | "active" | "inactive"); }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="ap-input"
              value={filterMemo}
              onChange={(e) => { setPage(1); setFilterMemo(e.target.value as "all" | "eligible" | "not"); }}
            >
              <option value="all">All Memo Status</option>
              <option value="eligible">Memo Eligible</option>
              <option value="not">Not Memo Eligible</option>
            </select>
          </div>

          {hasFilters && (
            <div className="ap-filter-summary">
              <span className="ap-filter-count">
                Showing <strong>{total.toLocaleString()}</strong> of <strong>{stats.total.toLocaleString()}</strong> products
              </span>
              {total > 0 && (
                <button
                  className="ap-btn-danger"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                  onClick={() => setModal({ mode: "filtered" })}
                >
                  🗑 Delete filtered ({total.toLocaleString()})
                </button>
              )}
              {total > 0 && (
                <button
                  className="ap-btn-success"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                  onClick={() => setModal({ mode: "reactivateFiltered" })}
                >
                  ♻ Reactivate filtered ({total.toLocaleString()})
                </button>
              )}
              <button
                className="ap-clear-btn"
                onClick={() => {
                  setPage(1);
                  setSearch(""); setDebouncedSearch(""); setFilterCategory(""); setFilterSubcategory(""); setFilterStatus("all");
                  setFilterShape(""); setFilterClarity(""); setFilterMemo("all");
                }}
              >
                Clear all filters ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ap-card">
        <div className="ap-table-wrap" style={{ opacity: tableLoading ? 0.55 : 1, transition: "opacity 0.12s" }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("name")}>Name <SortArrow k="name" /></th>
                <th>Type</th>
                <th className="sortable" onClick={() => handleSort("price")}>Price <SortArrow k="price" /></th>
                <th>Shape / Brand</th>
                <th>Color / Movement</th>
                <th>Clarity / Gender</th>
                <th className="sortable" onClick={() => handleSort("stock")}>Stock <SortArrow k="stock" /></th>
                <th>Status</th>
                <th>Memo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const watch = isWatch(p);
                return (
                  <tr key={p._id}>
                    <td className="td-name">{p.name}</td>
                    <td>
                      <span className={`ap-badge ${watch ? "watch" : "diamond"}`}>
                        {watch ? "⌚ Watch" : "💎 Diamond"}
                      </span>
                    </td>
                    <td className="td-price">${p.price.toLocaleString()}</td>
                    <td className="td-muted">
                      {watch
                        ? p.watchBrand || "—"
                        : Array.isArray(p.shape) ? (p.shape as string[]).join(", ") : p.shape || "—"}
                    </td>
                    <td className="td-muted">
                      {watch
                        ? p.watchMovement || "—"
                        : Array.isArray(p.color) ? (p.color as string[]).join(", ") : p.color || "—"}
                    </td>
                    <td className="td-muted">
                      {watch
                        ? p.watchGender || "—"
                        : Array.isArray(p.clarity) ? (p.clarity as string[]).join(", ") : p.clarity || "—"}
                    </td>
                    <td style={{ fontWeight: 600, color: p.stock < 5 ? "#dc2626" : "#222222" }}>
                      {p.stock}
                    </td>
                    <td>
                      <span className={`ap-badge ${p.isActive ? "active" : "inactive"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`ap-badge ${p.memoEligible ? "memo-on" : "memo-off"}`}
                        onClick={() => { setMemoModalProduct(p); setMemoModalError(""); }}
                        title="Click to edit memo settings"
                      >
                        {p.memoEligible
                          ? `📋 Memo (${p.memoMinDays ?? 3}–${p.memoMaxDays ?? MEMO_MAX_DAYS_CEILING}d)`
                          : "— Not Memo"}
                      </button>
                    </td>
                    <td>
                      <div className="ap-row-actions">
                        {p.isActive ? (
                          <button
                            className="ap-deactivate"
                            onClick={() => handleDeactivate(p._id)}
                            title="Deactivate (soft delete)"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="ap-reactivate"
                            onClick={() => handleReactivate(p._id)}
                            title="Reactivate this product"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          className="ap-delete-row"
                          onClick={() => setModal({ mode: "single", id: p._id, name: p.name })}
                          title="Permanently delete this product"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && !tableLoading && (
          <div className="ap-empty">
            <div className="ap-empty-icon">◇</div>
            <div className="ap-empty-title">
              {hasFilters ? "No matching products" : "No products yet"}
            </div>
            <div className="ap-empty-sub">
              {hasFilters ? "Try adjusting your filters" : "Add your first product above"}
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="ap-pagination">
            <span className="ap-page-info">
              Page {page} of {totalPages} · {total.toLocaleString()} results
            </span>
            <div className="ap-page-btns">
              <button className="ap-page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="ap-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    className={`ap-page-btn${p === page ? " current" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button className="ap-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              <button className="ap-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}