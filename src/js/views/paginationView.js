import icons from 'url:../../img/icons.svg';

class PaginationView {
  _parentEl = document.querySelector('[data-pagination]');
  _currentPage = 1;
  _maxVisiblePages = 5;

  render(data) {
    this._currentPage = data.page || 1;

    // Only show pagination if we have results
    if (!data.results || data.results.length === 0) {
      this._hide();
      return;
    }

    const markup = this._generateMarkup(data);
    this._parentEl.innerHTML = markup;
    this._show();
  }

  _generateMarkup(data) {
    const currentPage = data.page || 1;
    const hasMoreResults =
      data.results && data.results.length >= (data.resultsPerPage || 10);

    let html = `
      <div class="pagination">
        <!-- Previous Button -->
        <button 
          class="pagination__btn pagination__btn--prev" 
          data-pagination-prev
          ${currentPage === 1 ? 'disabled' : ''}
        >
          <svg>
            <use href="${icons}#icon-arrow-left"></use>
          </svg>
          Previous
        </button>

        <!-- Page Info -->
        <div class="pagination__info">
          <span>Page <strong>${currentPage}</strong></span>
        </div>

        <!-- Next Button -->
        <button 
          class="pagination__btn pagination__btn--next" 
          data-pagination-next
          ${!hasMoreResults ? 'disabled' : ''}
          title="${!hasMoreResults ? 'No more results available' : ''}"
        >
          Next
          <svg>
            <use href="${icons}#icon-arrow-right"></use>
          </svg>
        </button>
      </div>
    `;

    return html;
  }

  addHandlerClick(handler) {
    this._parentEl?.addEventListener('click', e => {
      const prevBtn = e.target.closest('[data-pagination-prev]');
      const nextBtn = e.target.closest('[data-pagination-next]');

      if (prevBtn && !prevBtn.disabled) {
        handler(this._currentPage - 1);
      }

      if (nextBtn && !nextBtn.disabled) {
        handler(this._currentPage + 1);
      }
    });
  }

  _show() {
    this._parentEl?.classList.remove('hidden');
  }

  _hide() {
    this._parentEl?.classList.add('hidden');
  }
}

export default new PaginationView();
