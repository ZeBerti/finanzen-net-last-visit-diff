window.reloadTimeoutAfterSuccess = 1000;

window.showNotification = function (wasSuccessful, text) {
    if (typeof window.notificationHandlerInstance === 'undefined' || window.notificationHandlerInstance === null) {
        return;
    }

    let variant = window.notificationHandlerInstance.variants.danger;

    if (wasSuccessful) {
        variant = window.notificationHandlerInstance.variants.success;
    }

    window.notificationHandlerInstance.showNotificationVariant(text, variant);
}

window.getRecaptchaTokenAndRefresh = function () {
    if (typeof window.retriggerRecaptcha !== 'undefined') {
        window.retriggerRecaptcha();
    }

    let tokenElement = document.getElementById('recaptcha-token');

    if (tokenElement) {
        return tokenElement.value;
    }

    return '';
}

window.getColorClassByPerformance = function (performance, isReverse) {
    if (performance > 0) {
        return isReverse ? 'font-color-danger' : 'font-color-success';
    }

    if (performance < 0) {
        return isReverse ? 'font-color-success' : 'font-color-danger';
    }

    return 'font-color-dark';
}

window.formatNumber = function (number, decimalPlaces) {
    var absoluteNumber = Math.abs(number).toFixed(decimalPlaces);

    var parts = absoluteNumber.split('.');
    var integerPart = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + '.');
    var decimalPart = parts[1] ? ',' + parts[1] : '';
    var sign = (number < 0) ? '-' : '';

    return sign + integerPart + decimalPart;
}
