var deleteDepotHandler = function () {
    this.deleteDepotIdPrefix = 'delete-depot-popup';

    this.popupElement = document.getElementById(this.deleteDepotIdPrefix);

    this.deleteDepotSubmit = document.getElementById(`${this.deleteDepotIdPrefix}-submit`);

    this.depotNameElement = document.getElementById(`${this.deleteDepotIdPrefix}-depotname`);
    this.depotIdElement = document.getElementById(`${this.deleteDepotIdPrefix}-depotid`);
    this.depotTypeIdElement = document.getElementById(`${this.deleteDepotIdPrefix}-depottypeid`);


    this.initDeletePopup = function () {
        var that = this;

        Array.from(document.getElementsByClassName('delete-depot-button')).forEach(function (button) {
            button.addEventListener('click', function () {
                that.openDeletePopup();
                that.buildDeletePopupContent(button);
            });
        });

        Array.from(document.getElementsByClassName(`${this.deleteDepotIdPrefix}-close`)).forEach(function (element) {
            element.addEventListener('click', function () {
                that.closeDeletePopup();
            });
        });
    }


    this.initDeletePopupSubmit = function () {
        var that = this;
        this.deleteDepotSubmit.addEventListener('click', function () {
            that.deleteDepotSubmit.classList.add('button--loading');
            that.prepareAndSendDeleteDepotRequest();
        });
    }


    this.buildDeletePopupContent = function (element) {
        this.depotNameElement.innerText = element.getAttribute('data-title')
        this.depotIdElement.setAttribute('data-value', element.getAttribute('data-id'));
        this.depotTypeIdElement.setAttribute('data-value', element.getAttribute('data-depottype-id'));
    }


    this.openDeletePopup = function () {
        this.depotNameElement.innerText = '';
        this.depotIdElement.setAttribute('data-value', '');
        this.depotTypeIdElement.setAttribute('data-value', '');

        this.popupElement.classList.remove('display-none');
    }


    this.closeDeletePopup = function () {
        this.deleteDepotSubmit.classList.remove('button--loading');
        this.popupElement.classList.add('display-none');
    }


    this.prepareAndSendDeleteDepotRequest = function () {
        let formData = {
            'strFunction': 'delete',
            'recaptcha-token': window.getRecaptchaTokenAndRefresh(),
            'recaptcha-action': 'curatedwatchlistoverview',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'depot-id': this.depotIdElement.getAttribute('data-value')
        };

        var formBody = [];

        for (var property in formData) {
            formBody.push(`${encodeURIComponent(property)}=${encodeURIComponent(formData[property])}`);
        }

        let fetchData = {
            method: 'POST',
            body: formBody.join('&'),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
        }

        var that = this;

        let depotTypeId = this.depotTypeIdElement.getAttribute('data-value');


        let endpoint = 'depots';
        let targetPage = 'depot';
        let errorMessagePart = 'das letzte Depot';
        if (depotTypeId === '2') {
            endpoint = 'watchlists';
            targetPage = 'watchlist';
            errorMessagePart = 'die letzte Watchlist';
        }

        fetch(`${window.userApiEndpoint}/${endpoint}.asp`, fetchData)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.Succeeded) {
                    that.closeDeletePopup();
                    window.showNotification(true, data.Message);
                    setTimeout(
                        function () { window.location.replace(`/depot/${targetPage}.asp`) },
                        window.reloadTimeoutAfterSuccess
                    );
                }
                else {
                    that.closeDeletePopup();
                    window.showNotification(false, data.Message);
                }
            })
            .catch(function () {
                that.closeDeletePopup();
                window.showNotification(false, 'Das hat nicht geklappt. Versuchen Sie es bitte nochmals.');
            });
    }


    this.initDeletePopup();
    this.initDeletePopupSubmit();
}


document.addEventListener('DOMContentLoaded', function () {
    deleteDepotHandler();
});