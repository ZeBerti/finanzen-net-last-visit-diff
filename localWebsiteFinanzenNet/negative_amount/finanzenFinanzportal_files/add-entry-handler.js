var addEntryHandler = function () {
    this.addEntryIdPrefix = 'add-entry-popup';

    this.popupAddEntryElement = document.getElementById(this.addEntryIdPrefix);
    this.addEntryInputElement = document.getElementById(`${this.addEntryIdPrefix}-input`);
    this.addEntrySubmitButton = document.getElementById(`${this.addEntryIdPrefix}-submit`);


    this.initAddEntryPopup = function () {
        var that = this;

        Array.from(document.getElementsByClassName('add-entry-button')).forEach(function (button) {
            button.addEventListener('click', function () {
                that.openAddEntryPopup(button);
            });
        });

        Array.from(document.getElementsByClassName(`${this.addEntryIdPrefix}-close`)).forEach(function (element) {
            element.addEventListener('click', function () {
                that.closeAddEntryPopup();
            });
        });

        if(this.addEntryInputElement != null){
            this.addEntryInputElement.addEventListener('input', function () {
                if (that.addEntryInputElement.value !== '' && that.addEntryInputElement.value.length >= 3) {
                    that.addEntrySubmitButton.disabled = false;
                }
            });
         }
    }


    this.openAddEntryPopup = function (element) {
        this.addEntryInputElement.value = '';
        this.popupAddEntryElement.classList.remove('display-none');
    }


    this.closeAddEntryPopup = function () {
        this.popupAddEntryElement.classList.add('display-none');
    }


    this.initAddEntryPopup();
}


document.addEventListener('DOMContentLoaded', function () {
    addEntryHandler();
});