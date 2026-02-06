class JobSearchView {
  _parentEL = document.querySelector('.search');

  constructor() {
    this._searchInput = this._parentEL?.querySelector('[data-search-input]');
    this._searchBtn = this._parentEL?.querySelector('[data-search-btn]');
    this._countryFilter = this._parentEL?.querySelector(
      '[data-filter-country]',
    );
    this._typeFilter = this._parentEL?.querySelector('[data-filter-type]');
    this._experienceFilter = this._parentEL?.querySelector(
      '[data-filter-experience]',
    );
    this._sortFilter = this._parentEL?.querySelector('[data-filter-sort]');
    this._clearBtn = this._parentEL?.querySelector('[data-search-clear]');
    this._suggestions = this._parentEL?.querySelector(
      '[data-search-suggestions]',
    );
  }

  getSearchQuery() {
    return this._searchInput?.value.trim() || '';
  }

  clearSearch() {
    if (this._searchInput) {
      this._searchInput.value = '';
      this._clearBtn?.classList.add('hidden');
    }
  }

  getFilters() {
    return {
      country: this._countryFilter?.value || '',
      jobType: this._typeFilter?.value || '',
      experience: this._experienceFilter?.value || '',
      sortBy: this._sortFilter?.value || '',
    };
  }

  showClearButton() {
    this._clearBtn?.classList.remove('hidden');
  }

  hideClearButton() {
    this._clearBtn?.classList.add('hidden');
  }

  addHandlerSearch(handler) {
    const executeSearch = () => {
      const query = this.getSearchQuery();
      if (!query) return;

      console.log('🔍 Search triggered:', query);
      const filters = this.getFilters();

      this.showClearButton();
      handler(query, 1, filters);
    };

    // Handle Enter key in search input
    this._searchInput?.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });

    // Handle search button click
    this._searchBtn?.addEventListener('click', e => {
      e.preventDefault();
      executeSearch();
    });

    // Handle clear button
    this._clearBtn?.addEventListener('click', e => {
      e.preventDefault();
      this.clearSearch();
      this.hideClearButton();
    });

    // Show/hide clear button based on input content
    this._searchInput?.addEventListener('input', e => {
      if (e.target.value.trim()) {
        this.showClearButton();
      } else {
        this.hideClearButton();
      }
    });
  }

  addHandlerFilters(handler) {
    const filterElements = [
      this._countryFilter,
      this._typeFilter,
      this._experienceFilter,
      this._sortFilter,
    ].filter(Boolean);

    filterElements.forEach(filter => {
      filter.addEventListener('change', () => {
        const query = this.getSearchQuery();
        if (!query) return;

        const filters = this.getFilters();
        console.log('🔧 Filter changed:', filters);

        handler(filters);
      });
    });
  }

  addHandlerSuggestions(handler) {
    const suggestionTags =
      this._parentEL?.querySelectorAll('[data-suggestion]');

    suggestionTags?.forEach(tag => {
      tag.addEventListener('click', e => {
        const suggestion = e.target.dataset.suggestion;
        if (suggestion && this._searchInput) {
          this._searchInput.value = suggestion;
          this.showClearButton();

          const filters = this.getFilters();
          handler(suggestion, 1, filters);
        }
      });
    });
  }

  showSuggestions() {
    this._suggestions?.classList.remove('hidden');
  }

  hideSuggestions() {
    this._suggestions?.classList.add('hidden');
  }

  focusSearch() {
    this._searchInput?.focus();
  }
}

export default new JobSearchView();
