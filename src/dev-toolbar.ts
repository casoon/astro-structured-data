import { defineToolbarApp } from 'astro/toolbar';

function renderGooglePreview(data: any): HTMLDivElement | null {
  const type = data['@type'];
  if (!type) return null;

  const container = document.createElement('div');
  container.className = 'asd-google-preview';

  // Extract common metadata
  const headline = data.headline || data.name || 'Untitled Document';
  const description = data.description || '';
  
  // Try to find image url
  let imageUrl = '';
  if (data.image) {
    if (typeof data.image === 'string') imageUrl = data.image;
    else if (Array.isArray(data.image)) {
      const first = data.image[0];
      imageUrl = typeof first === 'string' ? first : (first.url || first.contentUrl || '');
    } else if (typeof data.image === 'object') {
      imageUrl = data.image.url || data.image.contentUrl || '';
    }
  }

  // Author and date
  let formattedDate = '';
  if (data.datePublished) {
    try {
      const d = new Date(data.datePublished);
      formattedDate = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' — ';
    } catch {
      formattedDate = data.datePublished + ' — ';
    }
  }

  // Google Header row (e.g. logo, site name, breadcrumbs)
  const headerRow = document.createElement('div');
  headerRow.className = 'asd-google-header';
  
  const siteLogo = document.createElement('div');
  siteLogo.className = 'asd-google-header-logo';
  siteLogo.innerText = headline.charAt(0).toUpperCase();
  
  const siteName = document.createElement('span');
  siteName.className = 'asd-google-header-site';
  siteName.innerText = data.publisher?.name || 'Localhost';

  const pathBreadcrumb = document.createElement('span');
  pathBreadcrumb.className = 'asd-google-header-path';
  pathBreadcrumb.innerText = ' › ' + (type.toLowerCase());

  headerRow.appendChild(siteLogo);
  headerRow.appendChild(siteName);
  headerRow.appendChild(pathBreadcrumb);
  container.appendChild(headerRow);

  // Google Title
  const titleEl = document.createElement('div');
  titleEl.className = 'asd-google-title';
  titleEl.innerText = headline;
  container.appendChild(titleEl);

  // Render specific layout content
  if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
    // Thumbnail if image is set
    if (imageUrl) {
      const img = document.createElement('img');
      img.className = 'asd-google-thumbnail';
      img.src = imageUrl;
      container.appendChild(img);
    }

    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerHTML = `<span class="asd-google-date">${formattedDate}</span>${description}`;
    container.appendChild(snippet);

  } else if (type === 'FAQPage') {
    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerText = description || 'Frequently Asked Questions (FAQ) about this topic.';
    container.appendChild(snippet);

    const mainEntity = data.mainEntity;
    if (Array.isArray(mainEntity) && mainEntity.length > 0) {
      const faqList = document.createElement('ul');
      faqList.className = 'asd-google-faq-list';

      mainEntity.forEach((qObj: any) => {
        const questionText = qObj.name || qObj.headline;
        const answerText = qObj.acceptedAnswer?.text;

        if (questionText && answerText) {
          const faqItem = document.createElement('li');
          faqItem.className = 'asd-google-faq-item';

          const questionDiv = document.createElement('div');
          questionDiv.className = 'asd-google-faq-question';
          questionDiv.innerHTML = `<span>${questionText}</span><span class="asd-google-faq-arrow"></span>`;

          const answerDiv = document.createElement('div');
          answerDiv.className = 'asd-google-faq-answer';
          answerDiv.innerHTML = answerText;

          questionDiv.onclick = () => {
            const isActive = faqItem.classList.toggle('active');
            answerDiv.style.display = isActive ? 'block' : 'none';
          };

          faqItem.appendChild(questionDiv);
          faqItem.appendChild(answerDiv);
          faqList.appendChild(faqItem);
        }
      });
      container.appendChild(faqList);
    }

  } else if (type === 'Product') {
    // Determine stock status and pricing from offers
    let priceText = '';
    let inStock = true;
    let currency = '$';

    if (data.offers) {
      const getAvailability = (offer: any) => {
        const av = offer.availability;
        if (typeof av === 'string') {
          return !av.includes('OutOfStock');
        }
        return true;
      };

      if (Array.isArray(data.offers)) {
        const firstOffer = data.offers[0];
        if (firstOffer) {
          priceText = firstOffer.price !== undefined ? `${firstOffer.price}` : '';
          currency = firstOffer.priceCurrency || '$';
          inStock = getAvailability(firstOffer);
        }
      } else if (data.offers['@type'] === 'AggregateOffer') {
        const low = data.offers.lowPrice;
        const high = data.offers.highPrice;
        currency = data.offers.priceCurrency || '$';
        if (low !== undefined && high !== undefined) {
          priceText = `${low} - ${high}`;
        } else if (low !== undefined) {
          priceText = `${low}`;
        }
      } else {
        priceText = data.offers.price !== undefined ? `${data.offers.price}` : '';
        currency = data.offers.priceCurrency || '$';
        inStock = getAvailability(data.offers);
      }
    }

    // Stars rating
    let ratingValue = 0;
    let reviewCount = 0;
    if (data.aggregateRating) {
      ratingValue = Number(data.aggregateRating.ratingValue) || 0;
      reviewCount = Number(data.aggregateRating.reviewCount) || 0;
    } else if (data.review && Array.isArray(data.review)) {
      reviewCount = data.review.length;
      const sum = data.review.reduce((acc: number, r: any) => {
        const rating = r.reviewRating?.ratingValue;
        return acc + (Number(rating) || 0);
      }, 0);
      ratingValue = reviewCount > 0 ? Number((sum / reviewCount).toFixed(1)) : 0;
    }

    // Build Product metadata row
    const metaRow = document.createElement('div');
    metaRow.className = 'asd-google-product-meta';

    if (ratingValue > 0) {
      const fullStars = Math.floor(ratingValue);
      const halfStar = ratingValue % 1 >= 0.5 ? '½' : '';
      const starText = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
      
      const starsSpan = document.createElement('span');
      starsSpan.className = 'asd-google-stars';
      starsSpan.innerText = starText;
      
      const ratingText = document.createElement('span');
      ratingText.innerText = ` Rating: ${ratingValue} · ‎${reviewCount} reviews`;
      
      metaRow.appendChild(starsSpan);
      metaRow.appendChild(ratingText);
      metaRow.appendChild(document.createTextNode(' · '));
    }

    if (priceText) {
      const priceSpan = document.createElement('span');
      priceSpan.className = 'asd-google-price';
      priceSpan.innerText = `${currency} ${priceText}`;
      metaRow.appendChild(priceSpan);
      metaRow.appendChild(document.createTextNode(' · '));
    }

    const stockBadge = document.createElement('span');
    stockBadge.className = inStock ? 'asd-google-badge-stock' : 'asd-google-badge-out';
    stockBadge.innerText = inStock ? 'In stock' : 'Out of stock';
    metaRow.appendChild(stockBadge);

    container.appendChild(metaRow);

    // Thumbnail if image is set
    if (imageUrl) {
      const img = document.createElement('img');
      img.className = 'asd-google-thumbnail';
      img.src = imageUrl;
      container.appendChild(img);
    }

    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerText = description;
    container.appendChild(snippet);

  } else if (type === 'BreadcrumbList') {
    const itemList = data.itemListElement;
    if (Array.isArray(itemList) && itemList.length > 0) {
      container.innerHTML = '';
      
      const titleLabel = document.createElement('div');
      titleLabel.style.fontWeight = 'bold';
      titleLabel.style.marginBottom = '6px';
      titleLabel.style.fontSize = '12px';
      titleLabel.style.color = '#5f6368';
      titleLabel.innerText = 'BREADCRUMB PREVIEW';
      container.appendChild(titleLabel);

      const trail = document.createElement('div');
      trail.style.color = '#1a0dab';
      trail.style.fontWeight = '500';
      trail.style.fontSize = '14px';

      const items = itemList
        .sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
        .map((el: any) => el.name || 'Segment');
      
      trail.innerText = items.join('  ›  ');
      container.appendChild(trail);
    }

  } else if (type === 'Event') {
    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerText = description || 'Event preview details below.';
    container.appendChild(snippet);

    let monthStr = 'EVT';
    let dayStr = '??';
    if (data.startDate) {
      try {
        const d = new Date(data.startDate);
        monthStr = d.toLocaleString('en-US', { month: 'short' });
        dayStr = d.getDate().toString();
      } catch {}
    }

    const eventContainer = document.createElement('div');
    eventContainer.className = 'asd-google-event-container';

    const dateBox = document.createElement('div');
    dateBox.className = 'asd-google-event-datebox';
    dateBox.innerHTML = `<span class="asd-google-event-month">${monthStr}</span><span class="asd-google-event-day">${dayStr}</span>`;
    eventContainer.appendChild(dateBox);

    const details = document.createElement('div');
    details.className = 'asd-google-event-details';
    
    const evTitle = document.createElement('span');
    evTitle.className = 'asd-google-event-title';
    evTitle.innerText = headline;
    details.appendChild(evTitle);

    let locationStr = '';
    if (data.location) {
      if (typeof data.location === 'string') locationStr = data.location;
      else if (data.location.name) locationStr = data.location.name;
      else if (data.location.address) {
        const addr = data.location.address;
        locationStr = typeof addr === 'string' ? addr : `${addr.streetAddress || ''}, ${addr.addressLocality || ''}`;
      }
    }

    let timeStr = '';
    if (data.startDate) {
      try {
        const d = new Date(data.startDate);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {}
    }

    const evMeta = document.createElement('span');
    evMeta.className = 'asd-google-event-meta';
    evMeta.innerText = `${timeStr ? timeStr + ' · ' : ''}${locationStr}`;
    details.appendChild(evMeta);

    if (data.eventStatus) {
      const statusSpan = document.createElement('span');
      statusSpan.style.fontSize = '11px';
      statusSpan.style.marginTop = '2px';
      const cleanStatus = data.eventStatus.replace('https://schema.org/', '');
      statusSpan.style.color = cleanStatus === 'EventScheduled' ? '#137333' : '#c5221f';
      statusSpan.innerText = cleanStatus.replace('Event', '');
      details.appendChild(statusSpan);
    }

    eventContainer.appendChild(details);
    container.appendChild(eventContainer);

  } else if (type === 'JobPosting') {
    container.innerHTML = '';
    
    const titleLabel = document.createElement('div');
    titleLabel.style.fontWeight = 'bold';
    titleLabel.style.marginBottom = '6px';
    titleLabel.style.fontSize = '12px';
    titleLabel.style.color = '#5f6368';
    titleLabel.innerText = 'GOOGLE JOBS CARD PREVIEW';
    container.appendChild(titleLabel);

    const jobCard = document.createElement('div');
    jobCard.className = 'asd-google-job-card';

    const jTitle = document.createElement('div');
    jTitle.className = 'asd-google-job-title';
    jTitle.innerText = headline;
    jobCard.appendChild(jTitle);

    const jCompany = document.createElement('div');
    jCompany.className = 'asd-google-job-company';
    jCompany.innerText = data.hiringOrganization?.name || 'Company Name';
    jobCard.appendChild(jCompany);

    const jMetaRow = document.createElement('div');
    jMetaRow.className = 'asd-google-job-meta-row';

    let locationStr = 'Anywhere';
    if (data.jobLocation?.address) {
      const addr = data.jobLocation.address;
      locationStr = typeof addr === 'string' ? addr : `${addr.addressLocality || ''}, ${addr.addressCountry || ''}`;
    }
    const locBadge = document.createElement('span');
    locBadge.className = 'asd-google-job-badge';
    locBadge.innerText = `📍 ${locationStr}`;
    jMetaRow.appendChild(locBadge);

    if (data.employmentType) {
      const empBadge = document.createElement('span');
      empBadge.className = 'asd-google-job-badge';
      empBadge.innerText = `💼 ${data.employmentType.replace('_', ' ')}`;
      jMetaRow.appendChild(empBadge);
    }

    if (data.baseSalary?.value) {
      const salVal = data.baseSalary.value;
      const amount = typeof salVal === 'object' ? (salVal.value || '') : salVal;
      const currency = data.baseSalary.currency || '';
      const unit = data.baseSalary.unitText || data.baseSalary.unit || 'YEAR';
      
      const salBadge = document.createElement('span');
      salBadge.className = 'asd-google-job-badge';
      salBadge.innerText = `💵 ${currency} ${amount} / ${unit.toLowerCase()}`;
      jMetaRow.appendChild(salBadge);
    }

    jobCard.appendChild(jMetaRow);
    container.appendChild(jobCard);

  } else if (type === 'LocalBusiness') {
    container.innerHTML = '';
    
    const titleLabel = document.createElement('div');
    titleLabel.style.fontWeight = 'bold';
    titleLabel.style.marginBottom = '6px';
    titleLabel.style.fontSize = '12px';
    titleLabel.style.color = '#5f6368';
    titleLabel.innerText = 'LOCAL BUSINESS SNIPPET PREVIEW';
    container.appendChild(titleLabel);

    const bizCard = document.createElement('div');
    bizCard.className = 'asd-google-business-card';

    const bName = document.createElement('div');
    bName.className = 'asd-google-business-name';
    bName.innerText = headline;
    bizCard.appendChild(bName);

    if (data.telephone) {
      const bRow = document.createElement('div');
      bRow.className = 'asd-google-business-row';
      bRow.innerHTML = `<span class="asd-google-business-label">Phone:</span> ${data.telephone}`;
      bizCard.appendChild(bRow);
    }

    if (data.address) {
      const addr = data.address;
      const addrStr = typeof addr === 'string' ? addr : `${addr.streetAddress || ''}, ${addr.postalCode || ''} ${addr.addressLocality || ''}`;
      const bRow = document.createElement('div');
      bRow.className = 'asd-google-business-row';
      bRow.innerHTML = `<span class="asd-google-business-label">Address:</span> ${addrStr}`;
      bizCard.appendChild(bRow);
    }

    if (data.openingHours) {
      const bRow = document.createElement('div');
      bRow.className = 'asd-google-business-row';
      const hoursList = Array.isArray(data.openingHours) ? data.openingHours.join(', ') : data.openingHours;
      bRow.innerHTML = `<span class="asd-google-business-label">Hours:</span> ${hoursList}`;
      bizCard.appendChild(bRow);
    }

    container.appendChild(bizCard);

  } else if (type === 'SoftwareApplication') {
    let ratingValue = 0;
    let reviewCount = 0;
    if (data.aggregateRating) {
      ratingValue = Number(data.aggregateRating.ratingValue) || 0;
      reviewCount = Number(data.aggregateRating.reviewCount) || 0;
    }

    const metaRow = document.createElement('div');
    metaRow.className = 'asd-google-product-meta';

    if (ratingValue > 0) {
      const fullStars = Math.floor(ratingValue);
      const starText = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
      
      const starsSpan = document.createElement('span');
      starsSpan.className = 'asd-google-stars';
      starsSpan.innerText = starText;
      
      const ratingText = document.createElement('span');
      ratingText.innerText = ` Rating: ${ratingValue} · ‎${reviewCount} votes`;
      
      metaRow.appendChild(starsSpan);
      metaRow.appendChild(ratingText);
      metaRow.appendChild(document.createTextNode(' · '));
    }

    if (data.operatingSystem) {
      const osSpan = document.createElement('span');
      osSpan.innerText = `OS: ${data.operatingSystem}`;
      metaRow.appendChild(osSpan);
      metaRow.appendChild(document.createTextNode(' · '));
    }

    if (data.applicationCategory) {
      const catSpan = document.createElement('span');
      catSpan.innerText = `Category: ${data.applicationCategory}`;
      metaRow.appendChild(catSpan);
    }

    container.appendChild(metaRow);

    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerText = description;
    container.appendChild(snippet);
  } else if (type === 'Recipe') {
    let ratingValue = 0;
    let reviewCount = 0;
    if (data.aggregateRating) {
      ratingValue = Number(data.aggregateRating.ratingValue) || 0;
      reviewCount = Number(data.aggregateRating.reviewCount) || 0;
    }

    const metaRow = document.createElement('div');
    metaRow.className = 'asd-google-product-meta';

    if (ratingValue > 0) {
      const fullStars = Math.floor(ratingValue);
      const halfStar = ratingValue % 1 >= 0.5 ? '½' : '';
      const starText = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
      
      const starsSpan = document.createElement('span');
      starsSpan.className = 'asd-google-stars';
      starsSpan.innerText = starText;
      
      const ratingText = document.createElement('span');
      ratingText.innerText = ` ${ratingValue} (${reviewCount})`;
      
      metaRow.appendChild(starsSpan);
      metaRow.appendChild(ratingText);
      metaRow.appendChild(document.createTextNode(' · '));
    }

    const formatDuration = (dur: string) => {
      if (!dur) return '';
      const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
      if (match) {
        const h = match[1] ? `${match[1]} hr ` : '';
        const m = match[2] ? `${match[2]} min` : '';
        return `${h}${m}`.trim();
      }
      return dur;
    };

    const prep = formatDuration(data.prepTime);
    const cook = formatDuration(data.cookTime);
    if (prep || cook) {
      const timeSpan = document.createElement('span');
      timeSpan.innerText = prep && cook ? `Prep: ${prep} · Cook: ${cook}` : (prep ? `Prep: ${prep}` : `Cook: ${cook}`);
      metaRow.appendChild(timeSpan);
      metaRow.appendChild(document.createTextNode(' · '));
    }

    if (data.nutrition?.calories) {
      const calSpan = document.createElement('span');
      calSpan.innerText = `${data.nutrition.calories.replace(' calories', '')} cal`;
      metaRow.appendChild(calSpan);
    }

    container.appendChild(metaRow);

    if (imageUrl) {
      const img = document.createElement('img');
      img.className = 'asd-google-thumbnail';
      img.src = imageUrl;
      container.appendChild(img);
    }

    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerText = description;
    container.appendChild(snippet);

    if (Array.isArray(data.recipeIngredient)) {
      const ingrTitle = document.createElement('div');
      ingrTitle.style.fontWeight = 'bold';
      ingrTitle.style.fontSize = '12px';
      ingrTitle.style.color = '#5f6368';
      ingrTitle.style.marginTop = '8px';
      ingrTitle.innerText = `Ingredients (${data.recipeIngredient.length}):`;
      container.appendChild(ingrTitle);

      const ingrSnippet = document.createElement('div');
      ingrSnippet.style.fontSize = '12px';
      ingrSnippet.style.color = '#70757a';
      ingrSnippet.innerText = data.recipeIngredient.slice(0, 4).join(', ') + (data.recipeIngredient.length > 4 ? '...' : '');
      container.appendChild(ingrSnippet);
    }
  } else if (type === 'VideoObject') {
    container.innerHTML = '';
    
    const titleLabel = document.createElement('div');
    titleLabel.style.fontWeight = 'bold';
    titleLabel.style.marginBottom = '6px';
    titleLabel.style.fontSize = '12px';
    titleLabel.style.color = '#5f6368';
    titleLabel.innerText = 'GOOGLE VIDEO PREVIEW';
    container.appendChild(titleLabel);

    const videoCard = document.createElement('div');
    videoCard.style.display = 'flex';
    videoCard.style.gap = '12px';
    videoCard.style.border = '1px solid #dadce0';
    videoCard.style.borderRadius = '8px';
    videoCard.style.padding = '10px';
    videoCard.style.background = '#f8f9fa';
    videoCard.style.fontFamily = 'Arial, sans-serif';

    const thumbWrapper = document.createElement('div');
    thumbWrapper.style.position = 'relative';
    thumbWrapper.style.width = '120px';
    thumbWrapper.style.height = '68px';
    thumbWrapper.style.background = '#000';
    thumbWrapper.style.borderRadius = '6px';
    thumbWrapper.style.overflow = 'hidden';
    thumbWrapper.style.flexShrink = '0';

    const thumbImg = document.createElement('img');
    thumbImg.src = imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23ccc"/></svg>';
    thumbImg.style.width = '100%';
    thumbImg.style.height = '100%';
    thumbImg.style.objectFit = 'cover';
    thumbImg.style.opacity = '0.85';
    thumbWrapper.appendChild(thumbImg);

    const playIcon = document.createElement('div');
    playIcon.style.position = 'absolute';
    playIcon.style.top = '50%';
    playIcon.style.left = '50%';
    playIcon.style.transform = 'translate(-50%, -50%)';
    playIcon.style.width = '28px';
    playIcon.style.height = '28px';
    playIcon.style.background = 'rgba(0, 0, 0, 0.7)';
    playIcon.style.borderRadius = '50%';
    playIcon.style.display = 'flex';
    playIcon.style.alignItems = 'center';
    playIcon.style.justifyContent = 'center';
    playIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="white" style="width:14px; height:14px; margin-left:2px;"><path d="M8 5v14l11-7z"/></svg>`;
    thumbWrapper.appendChild(playIcon);

    if (data.duration) {
      const durBadge = document.createElement('span');
      durBadge.style.position = 'absolute';
      durBadge.style.bottom = '4px';
      durBadge.style.right = '4px';
      durBadge.style.background = 'rgba(0, 0, 0, 0.8)';
      durBadge.style.color = '#fff';
      durBadge.style.padding = '1px 4px';
      durBadge.style.borderRadius = '3px';
      durBadge.style.fontSize = '10px';
      durBadge.style.fontWeight = 'bold';

      const match = data.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/i);
      const mins = match?.[1] || '0';
      const secs = match?.[2] || '00';
      durBadge.innerText = `${mins}:${secs.padStart(2, '0')}`;
      thumbWrapper.appendChild(durBadge);
    }
    videoCard.appendChild(thumbWrapper);

    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.flexDirection = 'column';
    info.style.fontSize = '13px';

    const vTitle = document.createElement('div');
    vTitle.style.fontWeight = 'bold';
    vTitle.style.color = '#1a0dab';
    vTitle.style.fontSize = '14px';
    vTitle.style.lineHeight = '1.3';
    vTitle.innerText = headline;
    info.appendChild(vTitle);

    let metaText = '';
    if (data.uploadDate) {
      try {
        const d = new Date(data.uploadDate);
        metaText = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        metaText = data.uploadDate;
      }
    }
    if (data.interactionStatistic?.userInteractionCount) {
      metaText += ` · ${data.interactionStatistic.userInteractionCount} views`;
    }

    const vMeta = document.createElement('div');
    vMeta.style.color = '#70757a';
    vMeta.style.marginTop = '4px';
    vMeta.innerText = metaText;
    info.appendChild(vMeta);

    const vDesc = document.createElement('div');
    vDesc.style.color = '#4d5156';
    vDesc.style.marginTop = '4px';
    vDesc.style.fontSize = '12px';
    vDesc.style.lineHeight = '1.4';
    vDesc.innerText = description.length > 80 ? description.substring(0, 80) + '...' : description;
    info.appendChild(vDesc);

    videoCard.appendChild(info);
    container.appendChild(videoCard);
  } else {
    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    snippet.innerText = description || 'No preview description available.';
    container.appendChild(snippet);
  }

  return container;
}

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
        if (schemaType === 'Article' || schemaType === 'BlogPosting' || schemaType === 'NewsArticle') {
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
        } else if (schemaType === 'Recipe') {
          if (!data.name) warnings.push("Missing recipe 'name'");
          if (!data.description) warnings.push("Missing recipe 'description'");
          if (!data.recipeIngredient || !Array.isArray(data.recipeIngredient) || data.recipeIngredient.length === 0) {
            warnings.push("Recipe must have at least one ingredient under 'recipeIngredient'");
          }
          if (!data.recipeInstructions) {
            warnings.push("Recipe must have 'recipeInstructions'");
          }
        } else if (schemaType === 'VideoObject') {
          if (!data.name) warnings.push("Missing video 'name'");
          if (!data.description) warnings.push("Missing video 'description'");
          if (!data.thumbnailUrl && !data.thumbnail) warnings.push("Missing video 'thumbnailUrl'");
          if (!data.uploadDate) warnings.push("Missing video 'uploadDate'");
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
