var notificationHandler = function () {
    this.closeAfterSeconds = 6000;
    this.classPrefix = 'finnet-notification';
    this.iconElemClassName = `${this.classPrefix}__icon`;
    this.notificationElem = document.getElementById(`${this.classPrefix}-container`);
    if (this.notificationElem !== null) {
        this.notificationTextElem = this.notificationElem.querySelector(`.${this.classPrefix}__text`);
        this.notificationIconElem = this.notificationElem.querySelector(`.${this.iconElemClassName}`);
    }


    this.variants = {
        success: {
            key: 'success',
            defaultText: 'Das hat geklappt',
            icon: 'icon--check',
            iconBackground: 'background-color-success'
        },
        danger: {
            key: 'danger',
            defaultText: 'Das hat nicht geklappt',
            icon: 'icon--close',
            iconBackground: 'background-color-danger'
        }
    };



    this.showNotificationVariant = function (text, variant) {
        this.resetNotification();

        if (text === '') {
            text = variant.defaultText;
        }

        this.notificationElem.classList.add(`${this.classPrefix}--${variant.key}`);
        this.addIcon(variant);
        this.showNotification(text);
    }


    this.showNotification = function (text) {
        this.notificationTextElem.innerText = text;
        this.notificationElem.classList.add(`${this.classPrefix}--visible`);

        var that = this;
        setTimeout(
            function () { that.resetNotification() },
            this.closeAfterSeconds
        );
    }


    this.addIcon = function (variant) {
        this.notificationIconElem.classList.add(
            'icon',
            variant.icon,
            variant.iconBackground,
            'padding-0.25',
            'font-color-white',
            'border-radius-circle'
        );
    }


    this.resetNotification = function () {
        this.notificationElem.className = '';
        this.notificationElem.classList.add(this.classPrefix);

        this.notificationTextElem.innerText = '';

        this.notificationIconElem.className = '';
        this.notificationIconElem.classList.add(this.iconElemClassName);
    }
}

window.notificationHandlerInstance;

document.addEventListener('DOMContentLoaded', function () {
    window.notificationHandlerInstance = new notificationHandler();
});