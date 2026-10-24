import { defineToolbarApp } from 'astro/toolbar';
import { textEl } from './toolbar/dom.js';
import { CHECKED_TYPES, primaryType, collectWarnings } from './toolbar/checks.js';
import { renderGooglePreview } from './toolbar/preview.js';
import { styles } from './toolbar/styles.js';

export default defineToolbarApp({
  init(canvas, app, server) {
    // Inject stylesheet
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    canvas.appendChild(styleElement);

    // Main UI container
    const container = document.createElement('div');
    container.className = 'asd-container';
    canvas.appendChild(container);

    const render = () => {
      container.innerHTML = `
        <h3 class="asd-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="3"></circle>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
          </svg>
          Structured Data Generator
        </h3>
        <div id="asd-list"></div>
      `;

      const listContainer = container.querySelector('#asd-list') as HTMLDivElement;

      // Extract JSON-LD scripts from host document
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');

      if (scripts.length === 0) {
        listContainer.innerHTML = `
          <div class="asd-empty-state">
            No Structured Data (JSON-LD) found on this page.
            <div style="margin-top: 10px; font-size: 0.8rem; color: #64748b;">
              Add components like &lt;ArticleSchema /&gt; or &lt;FAQSchema /&gt; to generate structured data.
            </div>
          </div>
        `;
        return;
      }

      const createCard = (data: any, label: string, isGraphMember = false) => {
        const card = document.createElement('div');
        card.className = 'asd-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'asd-card-header';

        const typeBadge = document.createElement('span');
        typeBadge.className = 'asd-type-badge';
        typeBadge.innerText = [].concat(data['@type'] ?? 'Unknown').join(', ');
        cardHeader.appendChild(typeBadge);

        // Warnings and Validations
        const warnings = collectWarnings(data, isGraphMember);
        const schemaType = primaryType(data['@type']);

        const statusIndicator = document.createElement('div');
        if (!schemaType || !CHECKED_TYPES.has(schemaType)) {
          statusIndicator.className = 'asd-status-neutral';
          statusIndicator.textContent = 'Not checked';
        } else if (warnings.length > 0) {
          statusIndicator.className = 'asd-status-warning';
          statusIndicator.innerHTML = `⚠️ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
        } else {
          statusIndicator.className = 'asd-status-success';
          statusIndicator.innerHTML = `✓ Valid`;
        }
        cardHeader.appendChild(statusIndicator);
        card.appendChild(cardHeader);

        // Subtitle/index label
        const subLabel = document.createElement('div');
        subLabel.style.fontSize = '0.75rem';
        subLabel.style.color = '#64748b';
        subLabel.style.marginBottom = '8px';
        subLabel.innerText = label;
        card.insertBefore(subLabel, cardHeader.nextSibling);

        // Render warning list if any
        if (warnings.length > 0) {
          const warningList = document.createElement('ul');
          warningList.className = 'asd-warning-list';
          warnings.forEach(warning => {
            const li = document.createElement('li');
            li.innerText = warning;
            warningList.appendChild(li);
          });
          card.appendChild(warningList);
        }

        // Render Google Preview
        const previewEl = renderGooglePreview(data);
        if (previewEl) {
          card.appendChild(previewEl);
        }

        // Actions container
        const actionBar = document.createElement('div');
        actionBar.className = 'asd-action-bar';

        // Add Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'asd-btn asd-btn-copy';
        copyBtn.innerText = '📋 Copy JSON-LD';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = '✓ Copied!';
            setTimeout(() => {
              copyBtn.innerText = originalText;
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy text: ', err);
          });
        };

        // Add validator button
        const testBtn = document.createElement('button');
        testBtn.className = 'asd-btn asd-btn-test';
        testBtn.innerText = '🔍 Test on Schema.org';
        testBtn.onclick = () => {
          window.open('https://validator.schema.org/', '_blank');
        };

        // Add toggle button for raw view
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'asd-btn';
        toggleBtn.innerText = 'Show JSON-LD Raw';

        const rawView = document.createElement('pre');
        rawView.className = 'asd-raw-view';
        rawView.innerText = JSON.stringify(data, null, 2);

        toggleBtn.onclick = () => {
          const isVisible = rawView.style.display === 'block';
          rawView.style.display = isVisible ? 'none' : 'block';
          toggleBtn.innerText = isVisible ? 'Show JSON-LD Raw' : 'Hide JSON-LD Raw';
        };

        actionBar.appendChild(copyBtn);
        actionBar.appendChild(testBtn);
        actionBar.appendChild(toggleBtn);
        
        card.appendChild(actionBar);
        card.appendChild(rawView);
        listContainer.appendChild(card);
      };

      scripts.forEach((script, index) => {
        let data: any;
        try {
          data = JSON.parse(script.textContent ?? '');
        } catch {
          data = undefined;
        }
        if (data !== undefined) {
          // Rendering errors are bugs of the panel, not invalid JSON — let them surface as such.
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            data['@graph'].forEach((item: any, idx: number) => {
              createCard(item, `Script #${index + 1} (Graph Item #${idx + 1})`, true);
            });
          } else if (Array.isArray(data)) {
            data.forEach((item: any, idx: number) => {
              createCard(item, `Script #${index + 1} (Item #${idx + 1})`);
            });
          } else {
            createCard(data, `Script #${index + 1}`);
          }
        } else {
          const errorCard = document.createElement('div');
          errorCard.className = 'asd-card';
          errorCard.style.borderColor = '#ef4444';
          errorCard.innerHTML = `
            <div class="asd-card-header">
              <span class="asd-type-badge" style="background:#ef4444;">Invalid JSON</span>
              <div class="asd-status-error">❌ Parse Error</div>
            </div>
            <div style="color:#ef4444; font-size:0.875rem; margin-top:8px;">
              Failed to parse script tag content. Make sure it contains valid JSON.
            </div>
          `;
          const rawSource = textEl('pre', '', script.textContent ?? '');
          rawSource.style.cssText = 'background:#090d16; padding:8px; border-radius:4px; font-size:0.75rem; overflow-x:auto; margin-top:8px; color:#f87171;';
          errorCard.appendChild(rawSource);
          listContainer.appendChild(errorCard);
        }
      });
    };

    // Listen to toolbar toggle state
    app.onToggled(({ state }) => {
      if (state) {
        render();
      }
    });
  },
});
