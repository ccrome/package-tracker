/**
 * UPS Carrier implementation
 */
class UPSCarrier extends BaseCarrier {
    constructor() {
        super(
            'UPS',
            'ups',
            'https://www.ups.com/track?loc=en_US&tracknum={trackingNumber}&requester=WT/trackdetails',
            [
                /^1Z[0-9A-Z]{16}$/,           // Standard UPS tracking number
                /^T\d{10}$/,                  // UPS Express tracking number
                /^[0-9]{9}$/,                 // UPS Ground tracking number (9 digits)
                /^[0-9]{12}$/                 // UPS Ground tracking number (12 digits)
            ]
        );
    }

}

// Register the carrier
window.UPSCarrier = UPSCarrier; 