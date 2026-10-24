import { textEl } from './dom.js';
import { primaryType } from './checks.js';

function labeledRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'asd-google-business-row';
  row.append(textEl('span', 'asd-google-business-label', `${label}:`), ` ${value}`);
  return row;
}

export function renderGooglePreview(data: any): HTMLDivElement | null {
  const type = primaryType(data['@type']);
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
    snippet.append(textEl('span', 'asd-google-date', formattedDate), description);
    container.appendChild(snippet);

  } else if (type === 'FAQPage') {
    const snippet = document.createElement('p');
    snippet.className = 'asd-google-snippet';
    // Google retired FAQ rich results on 2026-05-07; FAQPage stays valid schema.org markup.
    snippet.innerText = 'Google no longer shows FAQ rich results (retired May 2026). Content check only:';
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
          questionDiv.append(textEl('span', '', questionText), textEl('span', 'asd-google-faq-arrow', ''));

          const answerDiv = textEl('div', 'asd-google-faq-answer', answerText);

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
    dateBox.append(textEl('span', 'asd-google-event-month', monthStr), textEl('span', 'asd-google-event-day', dayStr));
    eventContainer.appendChild(dateBox);

    const details = document.createElement('div');
    details.className = 'asd-google-event-details';
    
    const evTitle = document.createElement('span');
    evTitle.className = 'asd-google-event-title';
    evTitle.innerText = headline;
    details.appendChild(evTitle);

    // An event has a Place, a VirtualLocation, or both (Mixed).
    const locations: any[] = Array.isArray(data.location) ? data.location : data.location ? [data.location] : [];
    const locationStr = locations
      .map((location) => {
        if (typeof location === 'string') return location;
        if (location['@type'] === 'VirtualLocation') return 'Online';
        if (location.name) return location.name;
        if (location.address) {
          const addr = location.address;
          return typeof addr === 'string' ? addr : `${addr.streetAddress || ''}, ${addr.addressLocality || ''}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(' · ');

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
      bizCard.appendChild(labeledRow('Phone', String(data.telephone)));
    }

    if (data.address) {
      const addr = data.address;
      const addrStr = typeof addr === 'string' ? addr : `${addr.streetAddress || ''}, ${addr.postalCode || ''} ${addr.addressLocality || ''}`;
      bizCard.appendChild(labeledRow('Address', addrStr));
    }

    if (data.openingHours) {
      const hoursList = Array.isArray(data.openingHours) ? data.openingHours.join(', ') : String(data.openingHours);
      bizCard.appendChild(labeledRow('Hours', hoursList));
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
