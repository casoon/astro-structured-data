/** Stylesheet injected into the toolbar canvas. */
export const styles = `
  .asd-container {
    padding: 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    color: #f3f4f6;
    background: #0f172a;
    height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
  }
  .asd-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 0;
    margin-bottom: 20px;
    color: #38bdf8;
    font-size: 1.25rem;
    border-bottom: 1px solid #334155;
    padding-bottom: 12px;
  }
  .asd-header svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;
  }
  .asd-empty-state {
    color: #94a3b8;
    text-align: center;
    padding: 40px 20px;
    background: #1e293b;
    border-radius: 8px;
    border: 1px dashed #475569;
  }
  .asd-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
  .asd-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .asd-type-badge {
    background: #0284c7;
    color: #ffffff;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .asd-status-success {
    color: #4ade80;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .asd-status-neutral {
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .asd-status-warning {
    color: #fbbf24;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .asd-status-error {
    color: #f87171;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .asd-warning-list {
    margin: 10px 0 0 0;
    padding-left: 20px;
    font-size: 0.825rem;
    color: #fcd34d;
  }
  .asd-warning-list li {
    margin-bottom: 4px;
  }
  .asd-action-bar {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .asd-btn {
    background: #334155;
    color: #f8fafc;
    border: 1px solid #475569;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  .asd-btn:hover {
    background: #475569;
    border-color: #64748b;
  }
  .asd-btn-copy {
    background: #10b981;
    color: #ffffff;
    border-color: #059669;
  }
  .asd-btn-copy:hover {
    background: #059669;
  }
  .asd-btn-test {
    background: #2563eb;
    color: #ffffff;
    border-color: #1d4ed8;
  }
  .asd-btn-test:hover {
    background: #1d4ed8;
  }
  .asd-raw-view {
    background: #090d16;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
    font-family: 'Fira Code', monospace, Courier;
    font-size: 0.75rem;
    overflow-x: auto;
    display: none;
    white-space: pre-wrap;
    color: #a7f3d0;
  }

  /* Google Preview styles */
  .asd-google-preview {
    background: #ffffff;
    color: #202124;
    border-radius: 8px;
    padding: 16px;
    margin-top: 14px;
    margin-bottom: 10px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.58;
    border: 1px solid #dadce0;
    box-shadow: 0 1px 6px rgba(32,33,36,0.28);
  }
  .asd-google-preview a {
    text-decoration: none;
  }
  .asd-google-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #202124;
    margin-bottom: 4px;
  }
  .asd-google-header-logo {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f1f3f4;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 10px;
    color: #5f6368;
  }
  .asd-google-header-site {
    font-weight: 400;
  }
  .asd-google-header-path {
    color: #5f6368;
  }
  .asd-google-title {
    color: #1a0dab;
    font-size: 20px;
    line-height: 1.3;
    font-weight: 400;
    margin: 0 0 4px 0;
    cursor: pointer;
  }
  .asd-google-title:hover {
    text-decoration: underline;
  }
  .asd-google-snippet {
    color: #4d5156;
    font-size: 14px;
    margin: 0;
  }
  .asd-google-date {
    color: #70757a;
    margin-right: 4px;
  }
  .asd-google-thumbnail {
    float: right;
    width: 104px;
    height: 104px;
    object-fit: cover;
    border-radius: 8px;
    margin-left: 16px;
    border: 1px solid #dadce0;
  }
  .asd-google-preview::after {
    content: "";
    clear: both;
    display: table;
  }

  /* FAQ accordion styles */
  .asd-google-faq-list {
    margin-top: 12px;
    border-top: 1px solid #ebebeb;
    padding-left: 0;
    list-style: none;
  }
  .asd-google-faq-item {
    border-bottom: 1px solid #ebebeb;
  }
  .asd-google-faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-weight: bold;
    font-size: 13px;
    color: #1a0dab;
    cursor: pointer;
  }
  .asd-google-faq-question:hover {
    text-decoration: underline;
  }
  .asd-google-faq-answer {
    padding: 0 0 10px 0;
    color: #4d5156;
    font-size: 13px;
    display: none;
    line-height: 1.5;
  }
  .asd-google-faq-arrow {
    border: solid #5f6368;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(45deg);
    transition: transform 0.2s;
  }
  .asd-google-faq-item.active .asd-google-faq-arrow {
    transform: rotate(-135deg);
  }

  /* Product stars and badge styles */
  .asd-google-product-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: #70757a;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .asd-google-stars {
    color: #f1c40f;
    font-size: 15px;
    letter-spacing: 1px;
  }
  .asd-google-badge-stock {
    background: #e6f4ea;
    color: #137333;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
  .asd-google-badge-out {
    background: #fce8e6;
    color: #c5221f;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
  .asd-google-price {
    font-weight: bold;
    color: #202124;
  }

  /* Event styles */
  .asd-google-event-container {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    border-top: 1px solid #ebebeb;
    padding-top: 8px;
  }
  .asd-google-event-datebox {
    border: 1px solid #dadce0;
    border-radius: 8px;
    width: 50px;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
    text-align: center;
    background: #f8f9fa;
    flex-shrink: 0;
  }
  .asd-google-event-month {
    color: #c5221f;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .asd-google-event-day {
    font-size: 18px;
    font-weight: bold;
    color: #202124;
    line-height: 1.1;
  }
  .asd-google-event-details {
    display: flex;
    flex-direction: column;
    font-size: 13px;
  }
  .asd-google-event-title {
    color: #1a0dab;
    font-weight: bold;
    font-size: 14px;
  }
  .asd-google-event-title:hover {
    text-decoration: underline;
  }
  .asd-google-event-meta {
    color: #70757a;
  }

  /* Job posting styles */
  .asd-google-job-card {
    border: 1px solid #dadce0;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
    background: #f8f9fa;
  }
  .asd-google-job-title {
    font-size: 16px;
    font-weight: bold;
    color: #202124;
    margin-bottom: 4px;
  }
  .asd-google-job-company {
    font-size: 14px;
    color: #137333;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .asd-google-job-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: #5f6368;
  }
  .asd-google-job-badge {
    background: #e8eaed;
    padding: 2px 8px;
    border-radius: 4px;
    color: #3c4043;
  }

  /* Local Business Knowledge Panel snippet */
  .asd-google-business-card {
    border: 1px solid #dadce0;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
    background: #f8f9fa;
    font-size: 13px;
  }
  .asd-google-business-name {
    font-size: 16px;
    font-weight: bold;
    color: #202124;
    margin-bottom: 4px;
  }
  .asd-google-business-row {
    margin-bottom: 4px;
    color: #3c4043;
  }
  .asd-google-business-label {
    font-weight: bold;
    color: #202124;
  }
`;
