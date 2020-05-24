({
    processStyleUpdate: function( cmp, message, helper ){
        // Validate incoming Lightning Message Service Event
        if( message && message._params && message._params.styleObj ){
            let styleObj = message._params.styleObj;

            // Update component CSS variables with newly retrieved styling
            let outerDivStyles = cmp.getElement().style; // Retrieves the FIRST DOM item
            outerDivStyles.setProperty( "--accentColor", styleObj.accentColor );
            outerDivStyles.setProperty( "--fontSize", styleObj.fontSize + styleObj.fontUnit );

            // Add retrieved Input to start of existing list of StyleInputs
            let existingList = cmp.get( 'v.styleInput' );
            existingList.unshift( styleObj );
            cmp.set( 'v.styleInput', existingList );
        } else{
            console.log( 'FC_UserDetails_Styled - Retrieved Message has invalid format ', JSON.stringify( message ) );
        }
    }
});