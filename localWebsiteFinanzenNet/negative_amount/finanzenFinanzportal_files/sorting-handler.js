var sortingHandler = function () {

  const defaultSortingType = 'text';
  const sortingDescendingKey = 'desc';
  const sortingAscendingKey = 'asc';

  this.setupOverviewSortingEventListeners = function () {
      var that = this;

      document.getElementsByClassName('table-depot-watchlist-handler').forEach(function (sortableTable) {
        sortableTable.querySelectorAll('.table-title-sortable').forEach(function (sortableProperty) {
          sortableProperty.addEventListener('click', function () {
          let sortDescending = sortableProperty.getAttribute('data-sortingorder') === sortingDescendingKey;
          let sortingType = sortableProperty.getAttribute('data-sortingtype');
          
          if (sortingType === null) {
              sortingType = defaultSortingType;
          }        
          that.sortOverview(
            sortableTable,
            sortableProperty.getAttribute('data-sortingproperty'),
            sortDescending,
            sortingType
          );

          that.setOverviewSortingIcons(sortableTable ,sortableProperty, sortDescending);
          sortableProperty.setAttribute('data-sortingorder', sortDescending ? sortingAscendingKey : sortingDescendingKey);
        })
      });
    });
  }

  this.sortOverview = function (tableElement, attribute, isDescending, sortingType) {
    Array.prototype.slice
      .call(tableElement.querySelectorAll(".table-sorting-row"))
      .sort(function (a, b) {
        a = a.getAttribute(attribute).replace(",",".");
        b = b.getAttribute(attribute).replace(",",".");
     
        switch(sortingType) {
          case 'text':
            return isDescending ? b.localeCompare(a) : a.localeCompare(b);

          case 'numeric':
            return isDescending ? b - a : a - b;
        }
      })
      .forEach(function (node) {
        node.parentNode.appendChild(node);
      });
  }

  this.setOverviewSortingIcons = function (tableElement, sortableProperty, sortDescending) {
    tableElement.querySelectorAll('.table-title-sortable >.icon.active').forEach(function (sortingItem) {
        sortingItem.classList.remove('icon--sort-up', 'active');
        sortingItem.classList.add('icon--sort-down','font-color-gray-500');
      });
      const sortableItemClassList =  sortableProperty.getElementsByClassName('icon').item(0).classList;

      sortableItemClassList.remove('font-color-gray-500');
      sortableItemClassList.add(sortDescending ? 'icon--sort-down' : 'icon--sort-up');
      sortableItemClassList.add('active','font-color-brand-finnet');
  }

  this.setupOverviewSortingEventListeners()
}

window.addEventListener('DOMContentLoaded', function () {
  sortingHandler();
});