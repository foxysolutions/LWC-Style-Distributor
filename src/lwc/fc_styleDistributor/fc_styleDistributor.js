import { LightningElement, wire, track, api } from 'lwc';

// Import PubSub libraries and define Event name
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent, onNewListeners } from 'c/pubsub';
export const STYLE_EVENT_NAME = 'styleChange';

// Import messageService libraries and relevant Channel
import { publish, MessageContext } from 'lightning/messageService';
import STYLE_MESSAGE_CHANNEL from '@salesforce/messageChannel/StyleUpdateChannel__c';

// Define CSS Variables to allow (optional) alignment across all using components
export const CSS_VARIABLES = {
   COLOR_ACCENT:   '--accent-color',
   FONT_SIZE:      '--font-size'
};

export default class FC_StyleDistributor extends LightningElement {
    // Input parameters to control whether or not to publish a certain channel
    @api publishPubSub = false;
    @api publishMessageChannel = false;

    // Input parameters to allow dynamic initial values to be set
    @api defaultAccentColor;
    @api defaultFontSize;
    @api defaultFontUnit;

    // {CSSStyleDeclaration} The style component of :host
    _hostStyle = {};

    // Local styleObj to support onChange events and prevent constant getPropertyValue methods
    _styleObj = {
        accentColor:    null,
        fontSize:       null,
        fontUnit:       'px'   // set default unit for slider to set correct slide-range
    };

    // Font size slider support
    _fontSizeMin;
    _fontSizeMax;
    _fontSizeStep;
    FONT_RANGE_PER_UNIT = {
        px :{ min: 8, max: 25, step: 1 },
        rem:{ min: 0, max: 7, step: 0.5 },
        em: { min: 0, max: 10, step: 0.5 },
        '%':  { min: 50, max: 150, step: 5 },
    };
    get fontUnitOptions(){
        return [
            { label: 'px', value: 'px' },
            { label: 'rem', value: 'rem' },
            { label: 'em', value: 'em' },
            { label: '%', value: '%' }
        ];
    }

    // Get Current pageReference to allow PubSub to function
    @wire( CurrentPageReference ) pageRef;

    // Get MessageContext for Lightning Message Service
    @wire( MessageContext ) messageContext;

    /**
     * After first time rendering of component, capture the initial values
     * Add listener to new PubSubListeners to allow sending initial values even if they complete rendering AFTER this component
     */
    _hasRendered = false;
    renderedCallback(){
        if( !this._hasRendered ){
            this._hostStyle = this.template.host.style;
            this.setInitialValues();

            // Since listeners might complete rendering later that this component
            // Publish an 'initial welcome event' to all new Listeners
            onNewListeners( STYLE_EVENT_NAME, this.publishStyles, this );

            // Set rendered to TRUE after first rendering, as this method is called for each child and DOM update
            this._hasRendered = true;
        }
    }

    /**
     * Method to initiate the default values
     * - Check for input from calling code or LWC-Page-attribute input; then set inner variables AND update CSS properties
     * - When not provided, retrieve from the CSS Properties
     */
    setInitialValues(){
        // Get computed styles to get the initial :host{} variable values
        let computedStyles = window.getComputedStyle( this.template.host, null );

        if( this.defaultAccentColor ){
            this._styleObj.accentColor = this.defaultAccentColor;
            this._hostStyle.setProperty( CSS_VARIABLES.COLOR_ACCENT, this._styleObj.accentColor );
        } else{
            this._styleObj.accentColor = computedStyles.getPropertyValue( CSS_VARIABLES.COLOR_ACCENT );
        }

        if( this.defaultFontSize ){
            if( this.defaultFontUnit ){
                this._styleObj.fontUnit = this.defaultFontUnit;
                this.updateSliderSpecsForUnit();
            } // else leave it to default ( 'px' )
            // Set default font-size (after unit update, to prevent overriding the average of new unit range)
            this._styleObj.fontSize = this.defaultFontSize;

            this._hostStyle.setProperty( CSS_VARIABLES.FONT_SIZE, this._styleObj.fontSize + this._styleObj.fontUnit );
        } else{
            // When no font-size specified on input, retrieve font-size and unit from css file
            let fontDeclaration = computedStyles.getPropertyValue( CSS_VARIABLES.FONT_SIZE );
            let fontSizeMatcher = fontDeclaration.match( /\d+/ );
            // When font-size specified, split the integer-size from text-unit;
            if( fontSizeMatcher ){
                let matchedFontSize = fontSizeMatcher[ 0 ];
                this._styleObj.fontUnit = fontDeclaration.replace( matchedFontSize, '' ).trim();
                if( this._styleObj.fontUnit ){
                    this.updateSliderSpecsForUnit();
                }
                this._styleObj.fontSize = matchedFontSize;
            }
        }
    }

    /**
     * Change methods to select and publish the new style-attribute value
     */
    selectColor( evt ){
        this._styleObj.accentColor = evt.detail.value;
        this._hostStyle.setProperty( CSS_VARIABLES.COLOR_ACCENT, this._styleObj.accentColor );
        this.publishStyles();
    }

    selectFontSize( evt ){
        this._styleObj.fontSize = evt.detail.value;
        this._hostStyle.setProperty( CSS_VARIABLES.FONT_SIZE, this._styleObj.fontSize + this._styleObj.fontUnit );
        this.publishStyles();
    }

    selectFontUnit( evt ){
        this._styleObj.fontUnit = evt.detail.value;
        this.updateSliderSpecsForUnit();
        this._hostStyle.setProperty( CSS_VARIABLES.FONT_SIZE, this._styleObj.fontSize + this._styleObj.fontUnit );

        this.publishStyles();
    }

        /**
         * Method to update the slider range and set default
         * Didn't go for get fontRangeMin(); and such, as this didn't allow me to change font-size to default of selected unit
         */
        updateSliderSpecsForUnit(){
            let fontRange = this.FONT_RANGE_PER_UNIT[ this._styleObj.fontUnit ];
            if( fontRange ){
                this._fontSizeMin = fontRange.min;
                this._fontSizeMax = fontRange.max;
                this._fontSizeStep = fontRange.step;
                this._styleObj.fontSize = ( fontRange.max + fontRange.min ) / 2;
            } else{
                console.log( 'No font details found for '+ this._styleObj.fontUnit );
            }
        }

    /**
     * Method to publish the combined styling object
     */
    publishStyles(){
        if( this.publishPubSub ){           this.publishPubSubEvent(); }
        if( this.publishMessageChannel){    this.publishMessageChannelEvent(); }

        if( this.publishPubSub || this.publishMessageChannel ){
            console.log( 'published ', JSON.stringify( this._styleObj ) );
        } else{
            alert( 'FC Style Distributor says: Please configure me properly (in Lightning Page Builder or code), by selecting at least one publish channel.' );
        }
    }

        publishPubSubEvent(){
            fireEvent(  this.pageRef,
                        STYLE_EVENT_NAME,
                        this._styleObj );
        }

        publishMessageChannelEvent(){
            publish( this.messageContext, STYLE_MESSAGE_CHANNEL, { 'styleObj': this._styleObj } );
        }
}