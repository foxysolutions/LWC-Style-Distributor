import { LightningElement, wire } from 'lwc';

// Import PubSub libraries and Variable and Event definitions
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners, fireEvent } from 'c/pubsub';
import { CSS_VARIABLES, STYLE_EVENT_NAME } from 'c/fc_styleDistributor';

// Import GetRecord to retrieve User Details
import { getRecord } from 'lightning/uiRecordApi';
import CURRENT_USER_ID from '@salesforce/user/Id';

import FIELD_USER_FIRSTNAME from '@salesforce/schema/User.FirstName';
import FIELD_USER_LASTNAME from '@salesforce/schema/User.LastName';
import FIELD_USER_EMAIL from '@salesforce/schema/User.Email';

export default class FC_UserInfo extends LightningElement {
    // {User} User details of current running User
    _user = {};
    _loadingComplete = false;
    _userFound = false;

    // Retrieve the current PageReference to allow PubSub to work
    @wire( CurrentPageReference ) pageRef;
    // Retrieve the Current User Details
    @wire( getRecord, { recordId: CURRENT_USER_ID, fields: [ FIELD_USER_FIRSTNAME, FIELD_USER_LASTNAME, FIELD_USER_EMAIL ] } )
    processResponse( { error, data } ){
        console.log( 'error ', error );
        console.log( 'data ', data );
        if( error ){
            alert( 'error occurred fetching user details ', error );
        } else if( data ){
            this._user = {
                firstName:  data.fields.FirstName.value,
                lastName:   data.fields.LastName.value,
                email:      data.fields.Email.value
            };
            this._userFound = true;
        }
        // Mark loading as complete, when no user found, component is viewed in Guest User mode
        this._loadingComplete = true;
    }

    connectedCallback() {
        // subscribe to styleChange event when component is added to DOM
        registerListener( STYLE_EVENT_NAME, this.handleStyleChange, this );
    }

        /**
         * Method to update the CSS :host variable definitions to newly retrieved Style Input
         */
        handleStyleChange( styleObj ){
            this.template.host.style.setProperty( CSS_VARIABLES.COLOR_ACCENT, styleObj.accentColor );
            this.template.host.style.setProperty( CSS_VARIABLES.FONT_SIZE, styleObj.fontSize + styleObj.fontUnit );
        }

    disconnectedCallback() {
        // unsubscribe from styleChange event when component is removed from DOM
        unregisterAllListeners( this );
    }
}