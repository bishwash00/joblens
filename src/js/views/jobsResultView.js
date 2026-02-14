import BaseJobView from './baseJobView.js';
import icons from 'url:../../img/icons.svg';

class JobsResultView extends BaseJobView {
  _parentEl = document.querySelector('.results');
  _emptyEl = this._parentEl?.querySelector('[data-results-empty]');
  _loadingEl = this._parentEl?.querySelector('[data-results-loading]');
  _errorEl = this._parentEl?.querySelector('[data-results-error]');
  _resultsGridEl = this._parentEl?.querySelector('[data-results-container]');
  _resultsCountEl = this._parentEl?.querySelector(
    '[data-results-count] strong',
  );
  _data;
  _currencyVal;

  constructor() {
    super();
  }

  async render(data, currency = undefined) {
    console.log('🎨 Rendering job results:', data);

    if (!currency) this._data = data;
    else {
      this._data = data;
      this._currencyVal = currency;
    }

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
    const markup = await this._generateMarkup();
    if (this._resultsGridEl) {
      this._resultsGridEl.innerHTML = markup;
    }
  }

  clearGrid() {
    this._resultsGridEl.innerHTML = '';
  }

  renderSpinner() {
    this._hideAllStates();
    this._loadingEl?.classList.remove('hidden');
  }

  renderError(message = 'Something went wrong. Please try again.') {
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

  async _generateMarkup() {
    const cards = await Promise.all(
      this._data.results.map(job => this._generateJobCard(job)),
    );
    return cards.join('');
  }

  async _generateJobCard(job) {
    const companyInitial = this._getCompanyInitial(job.companyName);
    const description = this._truncateText(job.description, 120);
    const salaryDisplay = await this._formatSalaryDisplay(
      job,
      this._currencyVal?.base,
      this._currencyVal?.target,
    );
    const postedDate = this._formatPostedDate(job.postedDate);
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
            class="job-card__bookmark ${job.isBookmarked ? 'job-card__bookmark--active' : ''}"
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
      e.preventDefault();

      const bookmarkBtn = e.target.closest('[data-bookmark-btn]');
      if (bookmarkBtn) {
        bookmarkBtn.classList.toggle('job-card__bookmark--active');
        const jobCard = bookmarkBtn.closest('[data-job-id]');
        const jobId = jobCard?.dataset.jobId;
        if (jobId) {
          handler(jobId);
        }
      }
    });
  }

  addHandlerJobClick(handler) {
    this._resultsGridEl?.addEventListener('click', function (e) {
      const bookmarkBtn = e.target.closest('[data-bookmark-btn]');
      if (bookmarkBtn) return;

      const jobEl = e.target.closest('.job-card');
      if (!jobEl) return;

      const jobID = jobEl.dataset.jobId;
      handler(jobID);
    });
  }
}

export default new JobsResultView();
