var depotOrWatchlistOverview = function () {

    this.initDepotOrWatchlistOverview = async function () {
        await fillTableWithData();
        setClassToEnableSorting();
    };

    async function loadSingleDepotOrWatchlist (depotTypId, depotWatchlistId, tableRow) {
        var that = this;

        const formData = {
            'strFunction': 'getPerformance',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'depotid': depotWatchlistId
        };

        let formBody = [];

        for (var property in formData) {
            formBody.push(`${encodeURIComponent(property)}=${encodeURIComponent(formData[property])}`);
        }

        const fetchData = {
            method: 'POST',
            body: formBody.join('&'),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
        }
        const endpoint = depotTypId == 2 ? 'watchlists' : 'depots';
        await fetch(`${window.userApiEndpoint}/${endpoint}.asp`, fetchData)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                that.fillTableRowWithData(data, tableRow)
            })
            .catch(function () {
                window.showNotification(false, `Beim Laden ${depotTypId == 2 ? 'Ihrer Watchlist' : 'Ihres Depots'} ist ein Fehler aufgetreten.`);
            });
    }

    this.fillTableRowWithData = async function (data, tableRow) {
        tableRow.querySelector('.watchlist-depot-current-value').innerText = `${window.formatNumber(data.CurrentValue, 2)} €`;
        tableRow.setAttribute('data-watchlist-depot-current-value',  data.CurrentValue);

        tableRow.querySelector('.watchlist-depot-amount-positions').innerText = data.AmountPositions;
        tableRow.setAttribute('data-watchlist-depot-amount-positions', data.AmountPositions);

        let chartElement = tableRow.querySelector('.watchlist-depot-chart .img');
        chartElement.src = this.getCorrectChartUrl(data.ChartUrl);
        chartElement.classList.remove('invisible');
        tableRow.querySelector('.watchlist-depot-chart div').classList.remove('shimming');

        let todayPerformanceAbsoluteEl = tableRow.querySelector('.watchlist-depot-perf-today-absolute');
        todayPerformanceAbsoluteEl.innerText = `${window.formatNumber(data.TodayPerformanceAmount, 2)} €`;
        todayPerformanceAbsoluteEl.classList.add(window.getColorClassByPerformance(data.TodayPerformanceAmount), false);
        tableRow.setAttribute('data-watchlist-depot-perf-today-absolute',  data.TodayPerformanceAmount);

        let todayPerformanceRelativeEl = tableRow.querySelector('.watchlist-depot-perf-today-relative');
        todayPerformanceRelativeEl.innerText = `${window.formatNumber(data.TodayPerformancePercentage, 2)} %`;
        todayPerformanceRelativeEl.classList.add(window.getColorClassByPerformance(data.TodayPerformancePercentage, false));
        tableRow.setAttribute('data-watchlist-depot-perf-today-relative', data.TodayPerformancePercentage);

        let totalPerformanceAbsoluteEl = tableRow.querySelector('.watchlist-depot-perf-total-absolute');
        totalPerformanceAbsoluteEl.innerText = `${window.formatNumber(data.TotalPerformanceAmount, 2)} €`;
        totalPerformanceAbsoluteEl.classList.add(window.getColorClassByPerformance(data.TotalPerformanceAmount, false));
        tableRow.setAttribute('data-watchlist-depot-perf-total-absolute',  data.TotalPerformanceAmount);

        let totalPerformanceRelativeEl = tableRow.querySelector('.watchlist-depot-perf-total-relative');
        totalPerformanceRelativeEl.innerText = `${window.formatNumber(data.TotalPerformancePercentage, 2)} %`;
        totalPerformanceRelativeEl.classList.add(window.getColorClassByPerformance(data.TotalPerformancePercentage, false));
        tableRow.setAttribute('data-watchlist-depot-perf-total-relative',  data.TotalPerformancePercentage, 2);
    }

    this.getCorrectChartUrl = function (chartUrl) {
        return chartUrl.replaceAll('&amp;', '&');
    }

    function setClassToEnableSorting () {
       document.getElementsByClassName('table-depot-watchlist-handler').forEach(function (depotWatchlistTable) {
            depotWatchlistTable.querySelectorAll('.table__th .sortable').forEach(function (span){
                span.classList.add('table-title-sortable', 'hyperlink');
            });
        })
    }

    async function fillTableWithData () {
        for (const depotWatchlistTable of document.getElementsByClassName('table-depot-watchlist-handler')){
            for (const row of depotWatchlistTable.querySelectorAll('.table-depot-watchlist-row')){
                await loadSingleDepotOrWatchlist(row.getAttribute('data-watchlist-depot-depottyp'), row.getAttribute('depot-watchlist-data-id'), row);
            }
        };
    }

    this.initDepotOrWatchlistOverview();
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        depotOrWatchlistOverview();
    }, 500);
});
