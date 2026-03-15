var cloneWatchlistHandler = function () {
    this.cloneWatchlistIdPrefix = 'clone-watchlist';

    this.excludedIsins = [];


    this.initClonePopupSetupHandler = function () {
        var that = this;

        Array.from(document.getElementsByClassName(`${this.cloneWatchlistIdPrefix}-clone-button`)).forEach(function (cloneButton) {
            cloneButton.classList.remove('button--disable');

            cloneButton.addEventListener('click', function () {
                cloneButton.classList.add('button--loading');
                let watchlistId = cloneButton.getAttribute('data-watchlistid');
                let watchlistTitle = cloneButton.getAttribute('data-watchlisttitle');
                let initalSuffix = 0;
                that.titleExists(watchlistTitle, watchlistId, cloneButton, initalSuffix);
            });
        });

        const closeButton = document.getElementById(`${this.cloneWatchlistIdPrefix}-popup-close`);

        if (closeButton) {
            closeButton.addEventListener('click', function () {
                that.closeClonePopup();
            });
        }
    }


    this.initClonePopupSubmitHandler = function () {
        var that = this;
        const submitButton = document.getElementById(`${this.cloneWatchlistIdPrefix}-popup-submit`);

        if (submitButton) {
            submitButton.addEventListener('click', function () {
                that.prepareAndSendCloneWatchlistRequest();
            });
        }
    }

    this.tryReturnSuffixedTitle = function(title, suffix){
        return (suffix !== 0) ? `${title} ${suffix}` : title;
    }

    this.titleExists = function(watchlistTitle, watchlistId, cloneButton, titleSuffix) {
        var that = this;

        let formData = {
            'strFunction': 'titleExists',
            'recaptcha-token': window.getRecaptchaTokenAndRefresh(),
            'recaptcha-action': 'curatedwatchlistoverview',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'watchlist-title': this.tryReturnSuffixedTitle(watchlistTitle, titleSuffix),
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
    
        fetch(`${window.userApiEndpoint}/curatedwatchlists.asp`, fetchData)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.Existing) {
                    that.titleExists(watchlistTitle, watchlistId, cloneButton, titleSuffix + 1)
                }
                else {
                    that.buildClonePopupContent(watchlistId, this.tryReturnSuffixedTitle(watchlistTitle, titleSuffix), cloneButton);
                }
            })
            .catch(function () {
                window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte erneut!');
            });
    }


    this.buildClonePopupContent = function (watchlistId, watchlistTitle, cloneButton) {
        const watchlistTitleInput = document.getElementById(`${this.cloneWatchlistIdPrefix}-name`);
        watchlistTitleInput.value = watchlistTitle;

        const watchlistIdStore = document.getElementById(`${this.cloneWatchlistIdPrefix}-curatedwatchlist-id`);
        watchlistIdStore.setAttribute('data-id', watchlistId);

        this.requestWatchlistData(watchlistId, cloneButton);
        this.checkForPopupDataValidity();
    }


    this.requestWatchlistData = function (watchlistId, cloneButton) {
        let recaptchaToken = window.getRecaptchaTokenAndRefresh();

        if (recaptchaToken === '') {
            window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte erneut.');
            cloneButton.classList.remove('button--loading');
        }


        let formData = {
            'strFunction': 'getPositions',
            'recaptcha-token': recaptchaToken,
            'recaptcha-action': 'curatedwatchlistoverview',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'watchlist-id': watchlistId,
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

        fetch(`${window.userApiEndpoint}/curatedwatchlists.asp`, fetchData)
            .then(function (response) {
                return response.json();
            })
            .then(function (positions) {

                positions.forEach(function (position) {
                    that.buildPopupTableRow(position);
                });

                that.openClonePopup();
                cloneButton.classList.remove('button--loading');

                that.checkForPopupDataValidity();
            })
            .catch(function () {
                window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte erneut.');
                cloneButton.classList.remove('button--loading');
            });
    }


    this.buildPopupTableRow = function (position) {
        let isIsinValid = false;
        let isinValue = '-';

        if (position.Isin != '') {
            isIsinValid = true;
            isinValue = position.Isin;
        }


        const positionTableBody = document.getElementById(`${this.cloneWatchlistIdPrefix}-popup-positiontablebody`);

        const tableRow = document.createElement('tr');
        tableRow.classList.add('table__tr', `${this.cloneWatchlistIdPrefix}-position-row`);
        if (isIsinValid) {
            tableRow.classList.add(`${this.cloneWatchlistIdPrefix}-position-row--invalid`);
        }


        const nameTableData = document.createElement('td');
        nameTableData.classList.add('table__td');

        if (isIsinValid) {
            const linkToAsset = document.createElement('a');
            linkToAsset.target = '_blank';
            linkToAsset.href = `/go/${isinValue}`;
            linkToAsset.innerText = position.Name;

            nameTableData.appendChild(linkToAsset);
        }
        else {
            nameTableData.innerText = position.Name;
        }

        tableRow.appendChild(nameTableData);


        const isinTableData = document.createElement('td');
        isinTableData.classList.add('table__td');
        isinTableData.innerText = isinValue;

        tableRow.appendChild(isinTableData);


        const optionsTableData = document.createElement('td');
        optionsTableData.classList.add('table__td');

        if (isIsinValid) {
            const deleteButton = document.createElement('span');
            deleteButton.classList.add('icon', 'icon--bin', 'font-color-brand-finnet', `${this.cloneWatchlistIdPrefix}-delete-position`);
            deleteButton.setAttribute('data-position-isin', isinValue);
            optionsTableData.appendChild(deleteButton);

            this.addEventlistenerToDeletePositionButton(deleteButton);
        }

        tableRow.appendChild(optionsTableData);

        positionTableBody.appendChild(tableRow);
    }


    this.addEventlistenerToDeletePositionButton = function (buttonElem) {
        var that = this;
        buttonElem.addEventListener('click', function () {
            that.excludedIsins.push(buttonElem.getAttribute('data-position-isin'));

            buttonElem.parentElement.parentElement.remove();
            that.checkForPopupDataValidity();
        });
    }


    this.checkForPopupDataValidity = function () {
        const submitButton = document.getElementById(`${this.cloneWatchlistIdPrefix}-popup-submit`);

        const watchlistTitleInput = document.getElementById(`${this.cloneWatchlistIdPrefix}-name`);
        if (watchlistTitleInput.value === '') {
            submitButton.classList.add('button--disable');
            return;
        }

        const watchlistId = document.getElementById(`${this.cloneWatchlistIdPrefix}-curatedwatchlist-id`);
        if (!watchlistId.hasAttribute('data-id') || watchlistId.getAttribute('data-id') === '') {
            submitButton.classList.add('button--disable');
            return;
        }

        const positionEntries = document.querySelectorAll(`#${this.cloneWatchlistIdPrefix}-popup-positiontablebody .${this.cloneWatchlistIdPrefix}-position-row`);
        if (positionEntries.length <= 0) {
            submitButton.classList.add('button--disable');
            return;
        }

        submitButton.classList.remove('button--disable');
    }


    this.openClonePopup = function () {
        const popup = document.getElementById("clone-watchlist-popup");
        popup.classList.remove("display-none");
    }


    this.closeClonePopup = function () {
        const popup = document.getElementById(`${this.cloneWatchlistIdPrefix}-popup`);
        popup.classList.add('display-none');

        const positionTableBody = document.getElementById(`${this.cloneWatchlistIdPrefix}-popup-positiontablebody`);
        Array.from(positionTableBody.querySelectorAll(`.${this.cloneWatchlistIdPrefix}-position-row`)).forEach(function (element) {
            element.remove();
        });
    }

    this.prepareAndSendCloneWatchlistRequest = async function () {
        let formData = {
            'strFunction': 'createFromCuratedWatchlist',
            'recaptcha-token': window.getRecaptchaTokenAndRefresh(),
            'recaptcha-action': 'curatedwatchlistoverview',
            'lngUserId': window.getMyFinanzenUserId(),
            'strHashedPassword': window.getMyFinanzenHashedPassword(),
            'curatedwatchlist-id': document.getElementById(`${this.cloneWatchlistIdPrefix}-curatedwatchlist-id`).getAttribute('data-id'),
            'watchlist-title': document.getElementById(`${this.cloneWatchlistIdPrefix}-name`).value,
            'watchlist-isin-exclude': this.excludedIsins.join(',')
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

        await fetch(`${window.userApiEndpoint}/watchlists.asp`, fetchData)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (data.Succeeded) {
                    that.closeClonePopup();
                    window.showNotification(true, data.Message);
                    setTimeout(
                        function () { location.reload(); },
                        window.reloadTimeoutAfterSuccess
                    );
                }
                else {
                    that.closeClonePopup();
                    window.showNotification(false, data.Message);
                }
            })
            .catch(function () {
                that.closeClonePopup();
                window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte nochmals.');
            });
    }

    this.initClonePopupSetupHandler();
    this.initClonePopupSubmitHandler();
}

