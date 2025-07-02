/**
 * FedEx Carrier implementation
 */
class FedExCarrier extends BaseCarrier {
    constructor() {
        super(
            'FedEx',
            'fedex',
            'https://www.fedex.com/apps/fedextrack/?action=track&trackingnumber={trackingNumber}&cntry_code=us',
            [
                /^(?!9[0-5])\d{22}$/,         // 22 digits, but not USPS prefixes (90-95)
                /^\d{12}$/,                   // 12 digits
                /^\d{14}$/,                   // 14 digits
                /^\d{15}$/,                   // 15 digits (FedEx Ground)
                /^\d{20}$/,                   // 20 digits
                /^61\d{17}$/                  // FedEx SmartPost (starts with 61)
            ]
        );
    }

}

// Register the carrier
window.FedExCarrier = FedExCarrier; 