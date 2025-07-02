/**
 * DHL Carrier implementation
 */
class DHLCarrier extends BaseCarrier {
    constructor() {
        super(
            'DHL',
            'dhl',
            'https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}&brand=DHL',
            [
                /^\d{10}$/,                   // 10 digits
                /^\d{11}$/,                   // 11 digits
                /^[A-Z]{3}\d{7}$/,           // 3 letters + 7 digits
                /^[A-Z]{2}\d{9}$/,           // 2 letters + 9 digits
                /^JD\d{18}$/,                // JD + 18 digits (DHL eCommerce)
                /^GM\d{16}$/,                // GM + 16 digits (DHL Global Mail)
                /^LX\d{9}[A-Z]{2}$/          // LX + 9 digits + 2 letters
            ]
        );
    }

}

// Register the carrier
window.DHLCarrier = DHLCarrier; 