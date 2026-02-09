import icons from 'url:../../img/icons.svg';
import {
  formatCurrency,
  formatPostedDate,
  truncateText,
  getCompanyInitial,
} from '../helpers.js';

class JobModalView {
  _parentEl = document.querySelector('.job-modal');
  _jobModal = this._parentEl?.querySelector('.job-modal__content');
  _data;

  constructor() {
    this.addHandlerCloseModal();
  }

  _addModalView() {
    this._parentEl.classList.remove('hidden');
  }

  _hideModalView() {
    this._parentEl.classList.add('hidden');
  }

  async render(data) {
    this._jobModal.innerHTML = '';

    this._data = data;
    const markup = await this._generateMarkup();

    this._jobModal.insertAdjacentHTML('beforeend', markup);

    this._addModalView();
  }

  async _generateMarkup() {
    const companyInitial = getCompanyInitial(this._data.companyName);
    const description = truncateText(this._data.description, 500);
    const postedDate = formatPostedDate(this._data.postedDate);
    const jobTypeTag = this._getJobTypeTag(this._data.jobType);
    const responsibilitiesList = this._getListItems(
      this._data.highlights.responsibilities,
    );
    const qualificationsList = this._getListItems(
      this._data.highlights.qualifications,
    );

    const remoteTag = this._data.isRemote
      ? '<span class="job-card__tag job-card__tag--remote">Remote</span>'
      : '';

    return `
        <button
              class="job-modal__close"
              data-modal-close
              aria-label="Close modal"
            >
              <svg><use href="${icons}#icon-close"></use></svg>
            </button>

            <div class="job-modal__header">
              <div class="job-modal__company">
                <div class="job-modal__company-logo" data-modal-logo>
                   ${
                     this._data.companyLogo
                       ? `<img src="${this._data.companyLogo}" alt="${this._data.companyName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <span style="display:none;">${companyInitial}</span>`
                       : `<span>${companyInitial}</span>`
                   }
                </div>
                <div class="job-modal__company-info">
                  <h2 class="job-modal__title" data-modal-title>
                    ${this._data.title}
                  </h2>
                  <p class="job-modal__company-name" data-modal-company>
                    ${this._data.companyName}
                  </p>
                </div>
              </div>
              <button
                class="job-modal__bookmark"
                data-modal-bookmark
                aria-label="Bookmark job"
              >
                <svg><use href="${icons}#icon-bookmark"></use></svg>
                <span>Save Job</span>
              </button>
            </div>

            <div class="job-modal__meta">
              <div class="job-modal__meta-item">
                <svg><use href="${icons}#icon-location"></use></svg>
                <span data-modal-location>${this._data.location}</span>
              </div>
              <div class="job-modal__meta-item">
                <svg><use href="${icons}#icon-dollar"></use></svg>
                <span data-modal-salary>${await this._formatSalaryDisplay(this._data, 'USD')}</span>
              </div>
              <div class="job-modal__meta-item">
                <svg><use href="./src/img/icons.svg#icon-calendar"></use></svg>
                <span data-modal-posted>Posted ${postedDate}</span>
              </div>
            </div>

            <div class="job-modal__tags" data-modal-tags>
              ${remoteTag}
              ${jobTypeTag}
            </div>

            <div class="job-modal__section">
              <h3 class="job-modal__section-title">Job Description</h3>
              <div class="job-modal__description" data-modal-description>
                <p>
                  ${description}
                </p>

                <h4>Responsibilities:</h4>
                ${responsibilitiesList}

                <h4>Requirements:</h4>
                ${qualificationsList}
              </div>
            </div>

            <div class="job-modal__section">
              <h3 class="job-modal__section-title">Salary Comparison</h3>
              <div
                class="job-modal__salary-comparison"
                data-modal-salary-comparison
              >
                <div class="salary-comparison__item">
                  <span class="salary-comparison__currency">USD</span>
                  <span class="salary-comparison__value">${await this._formatSalaryDisplay(this._data, 'USD')}</span>
                </div>
                <div class="salary-comparison__item">
                  <span class="salary-comparison__currency">EUR</span>
                  <span class="salary-comparison__value"
                    >${await this._formatSalaryDisplay(this._data, 'USD', 'EUR')}</span
                  >
                </div>
                <div class="salary-comparison__item">
                  <span class="salary-comparison__currency">GBP</span>
                  <span class="salary-comparison__value"
                    >${await this._formatSalaryDisplay(this._data, 'USD', 'GBP')}</span
                  >
                </div>
                <div
                  class="salary-comparison__item salary-comparison__item--highlight"
                >
                  <span class="salary-comparison__currency">NPR</span>
                  <span class="salary-comparison__value"
                    >${await this._formatSalaryDisplay(this._data, 'USD', 'NPR')}</span
                  >
                </div>
              </div>
            </div>  

            <div class="job-modal__actions">
              <a
                href="${this._data.applyUrl}"
                class="job-modal__apply-btn"
                data-modal-apply
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply Now
                <svg>
                  <use href="${icons}#icon-external-link"></use>
                </svg>
              </a>
              
            </div>`;
  }

  _getListItems(list) {
    return `
                <ul>
                ${list
                  .map(
                    item => `
                    <li>${item}</li>
                    `,
                  )
                  .join('')}
                </ul>`;
  }

  async _formatSalaryDisplay(job, currency = 'USD', convertTo = null) {
    if (job.salaryMin && job.salaryMax) {
      return `${await formatCurrency(job.salaryMin, currency, convertTo)} - ${await formatCurrency(job.salaryMax, currency, convertTo)}`;
    } else if (job.salaryMin) {
      return `${await formatCurrency(job.salaryMin, currency, convertTo)}+`;
    } else if (job.salaryMax) {
      return `Up to ${await formatCurrency(job.salaryMax, currency, convertTo)}`;
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

  addHandlerCloseModal() {
    this._parentEl.addEventListener('click', e => {
      const btn = e.target.closest('.job-modal__close');
      if (!btn) return;

      this._hideModalView();
    });
  }
}

export default new JobModalView();
