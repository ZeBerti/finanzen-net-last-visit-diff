var newDepotHandler = function () {
    this.newDepotIdPrefix = 'new-depot';
    this.newDepotTitleInput = document.getElementById(`${this.newDepotIdPrefix}-title`);


    this.initNewDepot = function ()  {
        var that = this;

        Array.from(document.getElementsByClassName(`${this.newDepotIdPrefix}-button-open`)).forEach(function (openElem) {
            openElem.addEventListener('click', function () {
                that.openNewPopup();
            });
        })

        const saveButton = document.getElementById(`${this.newDepotIdPrefix}-button-save`);

        if (saveButton) {
            saveButton.addEventListener('click', function () {

                if (!that.newDepotTitleInput || that.newDepotTitleInput.value == '') {
                    that.newDepotTitleInput.classList.add('input--invalid');
                    return;
                }

                that.requestNewDepot(that.newDepotTitleInput.value);
            });
        }

        Array.from(document.getElementsByClassName(`${this.newDepotIdPrefix}-popup-close`)).forEach(function (closeElem) {
            closeElem.addEventListener('click', function () {
                that.closeNewPopup();
            });
        })
    }


    this.requestNewDepot = function (title) {
        const depotTypeElem = document.getElementById(`${this.newDepotIdPrefix}-depottypeid`);

        if (!depotTypeElem || depotTypeElem.getAttribute('data-value') == '') {
            window.showNotification(false, 'Bitte versuchen Sie es erneut.');
            return;
        }

        let depotTypeId = depotTypeElem.getAttribute('data-value');

        let formData = {
            'strFunction': 'create',
            'recaptcha-token': window.getRecaptchaTokenAndRefresh(),
            'recaptcha-action': 'curatedwatchlistoverview',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'depot-typeid': depotTypeId,
            'depot-title': title
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

        let endpoint = 'depots';
        let targetPage = 'depot';

        if (depotTypeId === '2') {
            endpoint = 'watchlists';
            targetPage = 'watchlist';
        }

        fetch(`${window.userApiEndpoint}/${endpoint}.asp`, fetchData)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.Succeeded) {
                    that.closeNewPopup();
                    window.showNotification(true, data.Message);
                    setTimeout(
                        function () { window.location.replace(`/depot/${targetPage}.asp`) },
                        window.reloadTimeoutAfterSuccess
                    );
                }
                else {
                    that.closeNewPopup();
                    window.showNotification(false, data.Message);
                }
            })
            .catch(function () {
                that.closeNewPopup();
                window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte nochmals.');
            });

        this.closeNewPopup();
    }

    this.openNewPopup = function () {
        document.getElementById(`${this.newDepotIdPrefix}-popup`).classList.remove('display-none');
    }


    this.closeNewPopup = function () {
        this.newDepotTitleInput.value = '';
        this.newDepotTitleInput.classList.remove('input--invalid');
        document.getElementById(`${this.newDepotIdPrefix}-popup`).classList.add('display-none');
    }

    this.initNewDepot();
}


document.addEventListener('DOMContentLoaded', function () {
    newDepotHandler();
});