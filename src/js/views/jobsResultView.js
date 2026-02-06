import icons from 'url:../../img/icons.svg';
import {
  formatCurrency,
  formatPostedDate,
  truncateText,
  getCompanyInitial,
} from '../helpers.js';

class JobsResultView {
  _parentEl = document.querySelector('.results');
  _emptyEl = this._parentEl?.querySelector('[data-results-empty]');
  _loadingEl = this._parentEl?.querySelector('[data-results-loading]');
  _errorEl = this._parentEl?.querySelector('[data-results-error]');
  _resultsGridEl = this._parentEl?.querySelector('[data-results-container]');
  _resultsCountEl = this._parentEl?.querySelector(
    '[data-results-count] strong',
  );
  _paginationEl = this._parentEl?.querySelector('[data-pagination]');
  _data;

  render(data) {
    console.log('🎨 Rendering job results:', data);

    this._data = data;
    this._hideAllStates();

    // Update results count
    if (this._resultsCountEl) {
      this._resultsCountEl.textContent =
        data.totalJobs || data.results?.length || 0;
    }

    if (!data.results || data.results.length === 0) {
      this._showEmptyState();
      return;
    }

    // Generate and insert markup
    const markup = this._generateMarkup();
    if (this._resultsGridEl) {
      this._resultsGridEl.innerHTML = markup;
    }

    this._renderPagination();
  }

  renderSpinner() {
    this._hideAllStates();
    this._loadingEl?.classList.remove('hidden');
  }

  renderError(message = 'Something went wrong. Please try again.') {
    console.error('🎨 Rendering error:', message);

    this._hideAllStates();
    this._errorEl?.classList.remove('hidden');

    const errorMessageEl = this._errorEl?.querySelector('[data-error-message]');
    if (errorMessageEl) {
      errorMessageEl.textContent = message;
    }
  }

  _hideAllStates() {
    this._emptyEl?.classList.add('hidden');
    this._loadingEl?.classList.add('hidden');
    this._errorEl?.classList.add('hidden');
  }

  _showEmptyState() {
    this._emptyEl?.classList.remove('hidden');
    if (this._resultsGridEl) {
      this._resultsGridEl.innerHTML = '';
    }
  }

  _generateMarkup() {
    return this._data.results.map(job => this._generateJobCard(job)).join('');
  }

  _generateJobCard(job) {
    const companyInitial = getCompanyInitial(job.companyName);
    const description = truncateText(job.description, 120);
    const salaryDisplay = this._formatSalaryDisplay(job);
    const postedDate = formatPostedDate(job.postedDate);
    const jobTypeTag = this._getJobTypeTag(job.jobType);
    const remoteTag = job.isRemote
      ? '<span class="job-card__tag job-card__tag--remote">Remote</span>'
      : '';

    return `
      <article class="job-card" data-job-id="${job.id}">
        <div class="job-card__header">
          <div class="job-card__company-logo" data-company-logo>
            ${
              job.companyLogo
                ? `<img src="${job.companyLogo}" alt="${job.companyName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <span style="display:none;">${companyInitial}</span>`
                : `<span>${companyInitial}</span>`
            }
          </div>
          <div class="job-card__meta">
            <span class="job-card__company">${job.companyName}</span>
            <span class="job-card__location">
              <svg>
                <use href="${icons}#icon-location"></use>
              </svg>
              ${job.location}
            </span>
          </div>
          <button
            class="job-card__bookmark"
            data-bookmark-btn
            aria-label="Bookmark job"
          >
            <svg>
              <use href="${icons}#icon-bookmark"></use>
            </svg>
          </button>
        </div>

        <div class="job-card__body">
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__description">
            ${description}
          </p>

          <div class="job-card__tags">
            ${remoteTag}
            ${jobTypeTag}
          </div>
        </div>

        <div class="job-card__footer">
          <div class="job-card__salary">
            <svg>
              <use href="${icons}#icon-dollar"></use>
            </svg>
            <span class="job-card__salary-amount" data-salary>
              ${salaryDisplay}
            </span>
          </div>
          <span class="job-card__posted">${postedDate}</span>
        </div>
      </article>
    `;
  }

  _formatSalaryDisplay(job) {
    if (job.salaryMin && job.salaryMax) {
      return `${formatCurrency(job.salaryMin)} - ${formatCurrency(job.salaryMax)}`;
    } else if (job.salaryMin) {
      return `${formatCurrency(job.salaryMin)}+`;
    } else if (job.salaryMax) {
      return `Up to ${formatCurrency(job.salaryMax)}`;
    }
    return 'Salary not specified';
  }

  _getJobTypeTag(jobType) {
    const typeMap = {
      FULLTIME: 'Full-time',
      PARTTIME: 'Part-time',
      CONTRACTOR: 'Contract',
      INTERN: 'Internship',
    };

    const displayType = typeMap[jobType] || jobType || 'Full-time';
    const cssClass = jobType?.toLowerCase() || 'fulltime';

    return `<span class="job-card__tag job-card__tag--${cssClass}">${displayType}</span>`;
  }

  _renderPagination() {
    if (
      this._paginationEl &&
      this._data.results &&
      this._data.results.length > 0
    ) {
      this._paginationEl.classList.remove('hidden');
    }
  }

  addHandlerPagination(handler) {
    const prevBtn = this._paginationEl?.querySelector('[data-pagination-prev]');
    const nextBtn = this._paginationEl?.querySelector('[data-pagination-next]');

    prevBtn?.addEventListener('click', () => {
      if (this._data.page > 1) {
        handler(this._data.page - 1);
      }
    });

    nextBtn?.addEventListener('click', () => {
      handler(this._data.page + 1);
    });

    this._paginationEl?.addEventListener('click', e => {
      const pageBtn = e.target.closest('[data-page]');
      if (pageBtn) {
        const page = parseInt(pageBtn.dataset.page);
        handler(page);
      }
    });
  }

  addHandlerRetry(handler) {
    const retryBtn = this._errorEl?.querySelector('[data-retry-btn]');
    retryBtn?.addEventListener('click', () => {
      if (this._data && this._data.query) {
        handler(
          this._data.query,
          this._data.page || 1,
          this._data.filters || {},
        );
      }
    });
  }

  addHandlerBookmark(handler) {
    this._resultsGridEl?.addEventListener('click', e => {
      const bookmarkBtn = e.target.closest('[data-bookmark-btn]');
      if (bookmarkBtn) {
        const jobCard = bookmarkBtn.closest('[data-job-id]');
        const jobId = jobCard?.dataset.jobId;
        if (jobId) {
          handler(jobId);
        }
      }
    });
  }
}

export default new JobsResultView();
