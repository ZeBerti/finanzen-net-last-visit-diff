var renameDepotHandler = function () {
    this.renameDepotIdPrefix = 'rename-depot-popup';

    this.popupRenameElement = document.getElementById(this.renameDepotIdPrefix);

    this.renameDepotSubmit = document.getElementById(`${this.renameDepotIdPrefix}-submit`);

    this.depotRenameTitleElement = document.getElementById(`${this.renameDepotIdPrefix}-title`);
    this.depotRenameInputElement = document.getElementById(`${this.renameDepotIdPrefix}-input`);
    this.depotRenameIdElement = document.getElementById(`${this.renameDepotIdPrefix}-depotid`);
    this.depotRenameTypeIdElement = document.getElementById(`${this.renameDepotIdPrefix}-depottypeid`);


    this.initRenamePopup = function () {
        var that = this;

        Array.from(document.getElementsByClassName('rename-depot-button')).forEach(function (button) {
            button.addEventListener('click', function () {
                that.openRenamePopup(button);
                that.buildRenamePopupContent(button);
            });
        });

        Array.from(document.getElementsByClassName(`${this.renameDepotIdPrefix}-close`)).forEach(function (element) {
            element.addEventListener('click', function () {
                that.closeRenamePopup();
            });
        });
    }


    this.initRenamePopupSubmit = function () {
        var that = this;
        this.renameDepotSubmit.addEventListener('click', function () {
            that.renameDepotSubmit.classList.add('button--loading');
            that.prepareAndSendRenameDepotRequest();
        });
    }


    this.buildRenamePopupContent = function (element) {
        this.depotRenameInputElement.value = element.getAttribute('data-title')
        this.depotRenameIdElement.setAttribute('data-value', element.getAttribute('data-id'));
        this.depotRenameTypeIdElement.setAttribute('data-value', element.getAttribute('data-depottype-id'));
    }


    this.openRenamePopup = function (element) {
        this.depotRenameInputElement.value = '';
        this.depotRenameIdElement.setAttribute('data-value', '');
        this.depotRenameTypeIdElement.setAttribute('data-value', '');

        this.depotRenameTitleElement.innerText = element.getAttribute('data-title');

        this.popupRenameElement.classList.remove('display-none');
    }


    this.closeRenamePopup = function () {
        this.renameDepotSubmit.classList.remove('button--loading');
        this.popupRenameElement.classList.add('display-none');
    }


    this.prepareAndSendRenameDepotRequest = function () {
        let formData = {
            'strFunction': 'rename',
            'recaptcha-token': window.getRecaptchaTokenAndRefresh(),
            'recaptcha-action': 'curatedwatchlistoverview',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'depot-id': this.depotRenameIdElement.getAttribute('data-value'),
            'depot-new-name': this.depotRenameInputElement.value
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

        let depotTypeId = this.depotRenameTypeIdElement.getAttribute('data-value');


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
                    that.closeRenamePopup();
                    window.showNotification(true, data.Message);
                    setTimeout(
                        function () { window.location.replace(`/depot/${targetPage}.asp`) },
                        window.reloadTimeoutAfterSuccess
                    );
                }
                else {
                    that.closeRenamePopup();
                    window.showNotification(false, data.Message);
                }
            })
            .catch(function () {
                that.closeRenamePopup();
                window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte nochmals.');
            });

    }


    this.initRenamePopup();
    this.initRenamePopupSubmit();
}


document.addEventListener('DOMContentLoaded', function () {
    renameDepotHandler();
});