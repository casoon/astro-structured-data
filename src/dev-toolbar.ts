import { defineToolbarApp } from 'astro/toolbar';

export default defineToolbarApp({
  init(canvas, app, server) {
    // Styling constants
    const styles = `
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
        margin-top: 12px;
      }
      .asd-btn:hover {
        background: #475569;
        border-color: #64748b;
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
    `;

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
        typeBadge.innerText = data['@type'] || 'Unknown';
        cardHeader.appendChild(typeBadge);

        // Warnings and Validations
        const warnings: string[] = [];
        if (!isGraphMember && !data['@context']) {
          warnings.push("Missing '@context' property (should be 'https://schema.org')");
        }

        // Type specific checks
        const schemaType = data['@type'];
        if (schemaType === 'Article') {
          if (!data.headline) warnings.push("Missing 'headline' (Google requires this for Articles)");
          if (!data.author) warnings.push("Missing 'author' (Google requires this for Articles)");
          if (!data.image) warnings.push("Missing 'image' (Google requires this for Articles)");
          if (!data.datePublished) warnings.push("Missing 'datePublished' (Google requires this for Articles)");
        } else if (schemaType === 'FAQPage') {
          if (!data.mainEntity || !Array.isArray(data.mainEntity) || data.mainEntity.length === 0) {
            warnings.push("FAQPage must have a non-empty 'mainEntity' list of Questions");
          } else {
            data.mainEntity.forEach((q: any, i: number) => {
              if (!q.name) warnings.push(`Question #${i + 1} is missing 'name' (the question text)`);
              if (!q.acceptedAnswer || !q.acceptedAnswer.text) warnings.push(`Question #${i + 1} is missing 'acceptedAnswer.text' (the answer)`);
            });
          }
        } else if (schemaType === 'Product') {
          if (!data.name) warnings.push("Missing 'name'");
          if (!data.image) warnings.push("Missing 'image' (Google requires this for Products)");
          if (!data.offers) {
            warnings.push("Missing 'offers' (recommended for Google Rich Results)");
          } else {
            const validateSingleOffer = (offer: any, prefix = "") => {
              if (offer.price === undefined) warnings.push(`${prefix}Offer is missing 'price'`);
              if (!offer.priceCurrency) warnings.push(`${prefix}Offer is missing 'priceCurrency'`);
              if (!offer.shippingDetails) warnings.push(`${prefix}Offer is missing 'shippingDetails' (recommended for Google Merchant Listings)`);
              if (!offer.hasMerchantReturnPolicy) warnings.push(`${prefix}Offer is missing 'hasMerchantReturnPolicy' (recommended for Google Merchant Listings)`);
            };

            if (Array.isArray(data.offers)) {
              data.offers.forEach((o: any, idx: number) => {
                validateSingleOffer(o, `Offer #${idx + 1} `);
              });
            } else if (data.offers['@type'] === 'AggregateOffer') {
              if (data.offers.lowPrice === undefined) warnings.push("AggregateOffer is missing 'lowPrice'");
              if (data.offers.highPrice === undefined) warnings.push("AggregateOffer is missing 'highPrice'");
              if (!data.offers.priceCurrency) warnings.push("AggregateOffer is missing 'priceCurrency'");
            } else {
              validateSingleOffer(data.offers);
            }
          }
        } else if (schemaType === 'CollectionPage') {
          if (!data.name) warnings.push("Missing collection 'name'");
          if (!data.mainEntity) {
            warnings.push("CollectionPage should have a 'mainEntity' pointing to an ItemList");
          } else if (data.mainEntity['@type'] !== 'ItemList') {
            warnings.push("CollectionPage mainEntity must be of type 'ItemList'");
          } else {
            const list = data.mainEntity;
            if (!list.itemListElement || !Array.isArray(list.itemListElement) || list.itemListElement.length === 0) {
              warnings.push("CollectionPage ItemList must have non-empty 'itemListElement' list of Products");
            } else {
              list.itemListElement.forEach((el: any, i: number) => {
                if (el['@type'] !== 'ListItem') warnings.push(`Item #${i + 1} in collection list is not a 'ListItem'`);
                if (!el.item || el.item['@type'] !== 'Product') warnings.push(`ListItem #${i + 1} in collection does not point to a 'Product'`);
              });
            }
          }
        } else if (schemaType === 'BreadcrumbList') {
          if (!data.itemListElement || !Array.isArray(data.itemListElement) || data.itemListElement.length === 0) {
            warnings.push("BreadcrumbList must have 'itemListElement' containing ListItems");
          } else {
            data.itemListElement.forEach((item: any, i: number) => {
              if (!item.position) warnings.push(`Breadcrumb item #${i + 1} is missing 'position'`);
              if (!item.name) warnings.push(`Breadcrumb item #${i + 1} is missing 'name'`);
              if (!item.item) warnings.push(`Breadcrumb item #${i + 1} is missing 'item' (the URL)`);
            });
          }
        } else if (schemaType === 'LocalBusiness') {
          if (!data.name) warnings.push("Missing business 'name'");
          if (!data.address) warnings.push("Missing business 'address'");
        } else if (schemaType === 'Event') {
          if (!data.name) warnings.push("Missing event 'name'");
          if (!data.startDate) warnings.push("Missing event 'startDate'");
          if (!data.location) warnings.push("Missing event 'location'");
        } else if (schemaType === 'Organization') {
          if (!data.name) warnings.push("Missing organization 'name'");
        } else if (schemaType === 'WebSite') {
          if (!data.name) warnings.push("Missing website 'name'");
          if (!data.url) warnings.push("Missing website 'url'");
        } else if (schemaType === 'ProfilePage') {
          if (!data.mainEntity) warnings.push("ProfilePage must specify 'mainEntity' (Person)");
          else if (data.mainEntity['@type'] !== 'Person') warnings.push("ProfilePage mainEntity must be of type 'Person'");
        } else if (schemaType === 'JobPosting') {
          if (!data.title) warnings.push("Missing job 'title'");
          if (!data.description) warnings.push("Missing job 'description'");
          if (!data.datePosted) warnings.push("Missing job 'datePosted'");
          if (!data.hiringOrganization) warnings.push("Missing job 'hiringOrganization'");
          if (!data.jobLocation) warnings.push("Missing job 'jobLocation'");
        } else if (schemaType === 'SoftwareApplication') {
          if (!data.name) warnings.push("Missing software 'name'");
          if (!data.operatingSystem) warnings.push("Missing software 'operatingSystem'");
          if (!data.applicationCategory) warnings.push("Missing software 'applicationCategory'");
        }

        const statusIndicator = document.createElement('div');
        if (warnings.length > 0) {
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

        card.appendChild(toggleBtn);
        card.appendChild(rawView);
        listContainer.appendChild(card);
      };

      scripts.forEach((script, index) => {
        try {
          const data = JSON.parse(script.innerHTML);
          if (data['@graph'] && Array.isArray(data['@graph'])) {
            data['@graph'].forEach((item: any, idx: number) => {
              createCard(item, `Script #${index + 1} (Graph Item #${idx + 1})`, true);
            });
          } else {
            createCard(data, `Script #${index + 1}`);
          }
        } catch (err) {
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
            <pre style="background:#090d16; padding:8px; border-radius:4px; font-size:0.75rem; overflow-x:auto; margin-top:8px; color:#f87171;">${script.innerHTML}</pre>
          `;
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
