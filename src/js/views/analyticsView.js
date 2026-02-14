import { convertCurrency, formatCurrency, log } from '../helpers.js';

class AnalyticsView {
  _parentEl = document.querySelector('.analytics-view');
  _analyticsEl = this._parentEl?.querySelector('[data-analytics-content]');
  _emptyEl = this._parentEl?.querySelector('[data-analytics-empty]');

  // Stat elements
  _roleEl = this._parentEl?.querySelector('[data-analytics-role]');
  _statJobsEl = this._parentEl?.querySelector('[data-stat-jobs]');
  _statSalaryEl = this._parentEl?.querySelector('[data-stat-salary]');
  _statCountriesEl = this._parentEl?.querySelector('[data-stat-countries]');
  _statRemoteEl = this._parentEl?.querySelector('[data-stat-remote]');

  // Chart containers
  _demandChartEl = this._parentEl?.querySelector('[data-chart="demand"]');
  _salaryChartEl = this._parentEl?.querySelector('[data-chart="salary"]');
  _typeChartEl = this._parentEl?.querySelector('[data-chart="type"]');
  _skillsChartEl = this._parentEl?.querySelector('[data-chart="skills"]');

  // Currency display
  _salaryCurrencyEl = this._parentEl?.querySelector('[data-salary-currency]');

  // Salary converter elements
  _salaryInputEl = this._parentEl?.querySelector('[data-salary-input]');
  _fromCurrencyEl = this._parentEl?.querySelector('[data-from-currency]');
  _toCurrencyEl = this._parentEl?.querySelector('[data-to-currency]');
  _convertedSalaryEl = this._parentEl?.querySelector('[data-converted-salary]');
  _resultCurrencyEl = this._parentEl?.querySelector('[data-result-currency]');

  _data = null;

  // Format large numbers (e.g., 12500 -> "12.5K", 1200000 -> "1.2M")
  _formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000)
      return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toLocaleString();
  }

  // Show empty state (before any search)
  renderEmpty() {
    if (!this._parentEl) return;
    if (this._emptyEl) this._emptyEl.style.display = '';
    if (this._analyticsEl) this._analyticsEl.style.display = 'none';
  }

  // Hide empty state and show content
  _showContent() {
    if (this._emptyEl) this._emptyEl.style.display = 'none';
    if (this._analyticsEl) this._analyticsEl.style.display = '';
  }

  // Render analytics data into the view
  render(analyticsData) {
    if (!analyticsData || !this._parentEl) return;
    this._data = analyticsData;

    this._showContent();

    log('🎨 Rendering analytics view:', analyticsData);

    // Update role title
    if (this._roleEl) {
      this._roleEl.textContent = analyticsData.query || 'N/A';
    }

    // Render stats summary
    this._renderStats(analyticsData);

    // Render charts
    this._renderDemandChart(analyticsData.demandByCountry);
    this._renderSalaryChart(analyticsData.salaryByCountry);
    this._renderTypeChart(
      analyticsData.jobTypeDistribution,
      analyticsData.totalJobs,
    );
    this._renderSkillsChart(analyticsData.topSkills);
  }

  // Show loading state
  renderSpinner() {
    if (!this._parentEl) return;
    this._showContent();

    // Add loading class to stat values
    const statValues = this._parentEl.querySelectorAll('.stat-card__value');
    statValues.forEach(el => {
      el.textContent = '...';
      el.classList.add('loading');
    });

    // Show loading in charts
    [
      this._demandChartEl,
      this._salaryChartEl,
      this._typeChartEl,
      this._skillsChartEl,
    ].forEach(el => {
      if (el)
        el.innerHTML =
          '<div class="chart-loading"><div class="spinner"><div class="spinner__ring"></div></div><p>Loading analytics...</p></div>';
    });
  }

  // Remove loading state
  _clearLoading() {
    const statValues = this._parentEl?.querySelectorAll('.stat-card__value');
    statValues?.forEach(el => el.classList.remove('loading'));
  }

  // Show error state
  renderError(message = 'Failed to load analytics data.') {
    this._clearLoading();

    [
      this._demandChartEl,
      this._salaryChartEl,
      this._typeChartEl,
      this._skillsChartEl,
    ].forEach(el => {
      if (el) el.innerHTML = `<div class="chart-error"><p>${message}</p></div>`;
    });
  }

  // =============================================
  // Stats Summary
  // =============================================
  _renderStats(data) {
    this._clearLoading();

    if (this._statJobsEl) {
      this._statJobsEl.textContent = this._formatNumber(data.totalJobs);
    }
    if (this._statSalaryEl) {
      this._statSalaryEl.textContent = data.avgSalary
        ? `$${data.avgSalary.toLocaleString()}`
        : 'N/A';
    }
    if (this._statCountriesEl) {
      this._statCountriesEl.textContent = data.countryCount || '0';
    }
    if (this._statRemoteEl) {
      this._statRemoteEl.textContent = data.remotePercent
        ? `${data.remotePercent}%`
        : '0%';
    }

    // Hide trend indicators (we don't have historical data)
    const trends = this._parentEl?.querySelectorAll('.stat-card__trend');
    trends?.forEach(el => (el.style.display = 'none'));
  }

  // =============================================
  // Demand by Country Chart
  // =============================================
  _renderDemandChart(demandData) {
    if (!this._demandChartEl || !demandData || demandData.length === 0) {
      if (this._demandChartEl)
        this._demandChartEl.innerHTML =
          '<div class="chart-empty">No demand data available</div>';
      return;
    }

    const maxCount = Math.max(...demandData.map(d => d.count));

    const barsMarkup = demandData
      .map(country => {
        const widthPercent =
          maxCount > 0 ? Math.round((country.count / maxCount) * 100) : 0;
        const formattedCount = this._formatNumber(country.count);
        return `
          <div class="demand-bar">
            <div class="demand-bar__label">
              <span class="demand-bar__flag">${country.flag}</span>
              <span class="demand-bar__country">${country.name}</span>
            </div>
            <div class="demand-bar__track">
              <div class="demand-bar__fill" style="--width: ${widthPercent}%"></div>
            </div>
            <span class="demand-bar__value">${formattedCount}</span>
          </div>
        `;
      })
      .join('');

    this._demandChartEl.innerHTML = `<div class="demand-bars">${barsMarkup}</div>`;

    // Animate bars
    requestAnimationFrame(() => {
      this._demandChartEl.querySelectorAll('.demand-bar__fill').forEach(bar => {
        bar.style.width = bar.style.getPropertyValue('--width');
      });
    });
  }

  // =============================================
  // Salary by Country Chart
  // =============================================
  _renderSalaryChart(salaryData) {
    if (!this._salaryChartEl || !salaryData || salaryData.length === 0) {
      if (this._salaryChartEl)
        this._salaryChartEl.innerHTML =
          '<div class="chart-empty">No salary data available</div>';
      return;
    }

    const maxSalary = Math.max(...salaryData.map(d => d.avgSalary));

    // Short country names
    const shortNames = {
      'United States': 'USA',
      'United Kingdom': 'UK',
      Germany: 'Germany',
      Canada: 'Canada',
      Australia: 'Australia',
      France: 'France',
      Netherlands: 'Netherlands',
      Singapore: 'Singapore',
      India: 'India',
      Japan: 'Japan',
    };

    const barsMarkup = salaryData
      .map(country => {
        const widthPercent =
          maxSalary > 0 ? Math.round((country.avgSalary / maxSalary) * 100) : 0;
        const shortName = shortNames[country.name] || country.name;
        return `
          <div class="salary-bar">
            <div class="salary-bar__label">
              <span class="salary-bar__flag">${country.flag}</span>
              <span class="salary-bar__country">${shortName}</span>
            </div>
            <div class="salary-bar__track">
              <div class="salary-bar__fill" style="--width: ${widthPercent}%"></div>
            </div>
            <span class="salary-bar__value">$${country.avgSalary.toLocaleString()}</span>
          </div>
        `;
      })
      .join('');

    this._salaryChartEl.innerHTML = `<div class="salary-bars">${barsMarkup}</div>`;

    // Animate bars
    requestAnimationFrame(() => {
      this._salaryChartEl.querySelectorAll('.salary-bar__fill').forEach(bar => {
        bar.style.width = bar.style.getPropertyValue('--width');
      });
    });
  }

  // =============================================
  // Job Type Distribution (Donut Chart)
  // =============================================
  _renderTypeChart(typeData, totalJobs) {
    if (!this._typeChartEl || !typeData) {
      if (this._typeChartEl)
        this._typeChartEl.innerHTML =
          '<div class="chart-empty">No type data available</div>';
      return;
    }

    const circumference = 2 * Math.PI * 40; // r=40
    const remoteLen = (typeData.remote / 100) * circumference;
    const hybridLen = (typeData.hybrid / 100) * circumference;
    const onsiteLen = (typeData.onsite / 100) * circumference;

    this._typeChartEl.innerHTML = `
      <div class="donut-chart">
        <div class="donut-chart__visual">
          <svg viewBox="0 0 100 100" class="donut-chart__svg">
            <circle
              class="donut-chart__ring donut-chart__ring--remote"
              cx="50" cy="50" r="40"
              stroke-dasharray="${remoteLen} ${circumference}"
              stroke-dashoffset="0"
            />
            <circle
              class="donut-chart__ring donut-chart__ring--hybrid"
              cx="50" cy="50" r="40"
              stroke-dasharray="${hybridLen} ${circumference}"
              stroke-dashoffset="${-remoteLen}"
            />
            <circle
              class="donut-chart__ring donut-chart__ring--onsite"
              cx="50" cy="50" r="40"
              stroke-dasharray="${onsiteLen} ${circumference}"
              stroke-dashoffset="${-(remoteLen + hybridLen)}"
            />
          </svg>
          <div class="donut-chart__center">
            <span class="donut-chart__total">${this._formatNumber(totalJobs)}</span>
            <span class="donut-chart__label">Jobs</span>
          </div>
        </div>
        <div class="donut-chart__legend">
          <div class="donut-chart__legend-item">
            <span class="donut-chart__legend-color donut-chart__legend-color--remote"></span>
            <span class="donut-chart__legend-label">Remote</span>
            <span class="donut-chart__legend-value">${typeData.remote}%</span>
          </div>
          <div class="donut-chart__legend-item">
            <span class="donut-chart__legend-color donut-chart__legend-color--hybrid"></span>
            <span class="donut-chart__legend-label">Hybrid</span>
            <span class="donut-chart__legend-value">${typeData.hybrid}%</span>
          </div>
          <div class="donut-chart__legend-item">
            <span class="donut-chart__legend-color donut-chart__legend-color--onsite"></span>
            <span class="donut-chart__legend-label">On-site</span>
            <span class="donut-chart__legend-value">${typeData.onsite}%</span>
          </div>
        </div>
      </div>
    `;
  }

  // =============================================
  // Top Skills Chart
  // =============================================
  _renderSkillsChart(skillsData) {
    if (!this._skillsChartEl || !skillsData || skillsData.length === 0) {
      if (this._skillsChartEl)
        this._skillsChartEl.innerHTML =
          '<div class="chart-empty">No skills data available</div>';
      return;
    }

    const barsMarkup = skillsData
      .map(skill => {
        const percent = Math.min(skill.percent, 100);
        return `
          <div class="skill-item">
            <span class="skill-item__name">${skill.name}</span>
            <div class="skill-item__bar">
              <div class="skill-item__fill" style="--width: ${percent}%"></div>
            </div>
            <span class="skill-item__percent">${percent}%</span>
          </div>
        `;
      })
      .join('');

    this._skillsChartEl.innerHTML = `<div class="skills-list">${barsMarkup}</div>`;

    // Animate bars
    requestAnimationFrame(() => {
      this._skillsChartEl.querySelectorAll('.skill-item__fill').forEach(bar => {
        bar.style.width = bar.style.getPropertyValue('--width');
      });
    });
  }

  // =============================================
  // Salary Converter Handler
  // =============================================
  addHandlerSalaryConverter() {
    const convertHandler = async () => {
      const amount = parseFloat(this._salaryInputEl?.value);
      const fromCurrency = this._fromCurrencyEl?.value || 'USD';
      const targetCurrency = this._toCurrencyEl?.value || 'NPR';

      if (!amount || isNaN(amount)) {
        if (this._convertedSalaryEl)
          this._convertedSalaryEl.textContent = 'Enter a salary amount';
        if (this._resultCurrencyEl) this._resultCurrencyEl.textContent = '';
        return;
      }

      const currencyNames = {
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        NPR: 'Nepali Rupee',
        CHF: 'Swiss Franc',
        INR: 'Indian Rupee',
        AUD: 'Australian Dollar',
        CAD: 'Canadian Dollar',
        JPY: 'Japanese Yen',
        SGD: 'Singapore Dollar',
      };

      try {
        if (this._convertedSalaryEl)
          this._convertedSalaryEl.textContent = 'Converting...';

        const converted = await convertCurrency(
          amount,
          fromCurrency,
          targetCurrency,
        );

        if (this._convertedSalaryEl) {
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: targetCurrency,
            maximumFractionDigits: 0,
          }).format(converted);
          this._convertedSalaryEl.textContent = formatted;
        }

        if (this._resultCurrencyEl) {
          const name = currencyNames[targetCurrency] || targetCurrency;
          this._resultCurrencyEl.textContent = `${targetCurrency} (${name})`;
        }
      } catch (err) {
        console.error('Conversion failed:', err);
        if (this._convertedSalaryEl)
          this._convertedSalaryEl.textContent = 'Conversion failed';
      }
    };

    // Debounced input handler
    let debounceTimer;
    this._salaryInputEl?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(convertHandler, 500);
    });

    this._fromCurrencyEl?.addEventListener('change', convertHandler);
    this._toCurrencyEl?.addEventListener('change', convertHandler);
  }
}

export default new AnalyticsView();
