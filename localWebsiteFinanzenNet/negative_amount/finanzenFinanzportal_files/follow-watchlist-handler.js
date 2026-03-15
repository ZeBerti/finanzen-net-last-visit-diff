var followWatchlistHandler = function () {
    this.followWatchlistIdPrefix = 'follow-watchlist';

    this.initFollowHandler = function () {
        var that = this;

        Array.from(document.getElementsByClassName(`${this.followWatchlistIdPrefix}-button`)).forEach(function (button) {
            if (button.classList.contains('icon')) {
                if (button.getAttribute('data-followed') == '1') {
                    button.classList.add('font-color-yellow', 'icon--star');
                    button.classList.remove('icon--empty-star', 'font-color-primary');
                }
                else {
                    button.classList.remove('font-color-yellow', 'icon--star');
                    button.classList.add('icon--empty-star', 'font-color-primary');
                }


                button.classList.remove('font-color-gray-400');
            }
            else {
                button.classList.remove('button--disable');
            }

            button.addEventListener('click', function () {
                that.toggleFollow(button.getAttribute('data-id'));
            });
        });
    }

    this.initFollowHandler();
}

async function toggleFollow(watchlistId) {
    let formData = {
        'strFunction': 'toggleFollow',
        'recaptcha-token': window.getRecaptchaTokenAndRefresh(),
        'recaptcha-action': 'curatedwatchlistoverview',
        'lngUserId': window.getMyFinanzenUserId(),
        'strHashedPassword': window.getMyFinanzenHashedPassword(),
        'watchlist-id': watchlistId
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

    await fetch(`${window.userApiEndpoint}/curatedwatchlists.asp`, fetchData)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.Succeeded) {
                window.showNotification(true, data.Message);
                setTimeout(
                    function () { location.reload(); },
                    window.reloadTimeoutAfterSuccess
                );
            }
            else {
                window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte erneut.');
            }
        })
        .catch(function () {
            window.showNotification(false, 'Das hat nicht geklappt. Versuche es bitte erneut.');
        });
}
