import  DemoView from './DemoView';
import CompositeImageView from 'canvas_ui/CompositeImageView';
import Label from 'canvas_ui/Label';
import {PopIn} from 'canvas_ui/BasicAnimations';

/**
 * All flag images are stored in a single composite image.
 */

export default class CountryFlagsDemoView extends DemoView {
    constructor() {
        super('Country Flags');

        // Our flag composite image asset is 15x15 sub-images but the last
        // 3 sub-images are empty space.

        this.imageView = new CompositeImageView('assets/flags.png', 15, 15, 15*15-3);
        this.imageView.borderWidth=1;
        this.imageView.size.set(30, 22);
        this.imageView.index = 1;          // ZW is first due to asset issue, skip it
        this.addSubview(this.imageView);

        this.countryNames = [
            'ZW', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AN', 'AO', 'AR',
            'AS', 'AT', 'AU', 'AW', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG',
            'BH', 'BI', 'BJ', 'BM', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY',
            'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
            'CO', 'CR', 'CU', 'CV', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO',
            'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FM',
            'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GG', 'GH', 'GI', 'GL', 'GM',
            'GN', 'GP', 'GQ', 'GR', 'GT', 'GU', 'GW', 'GY', 'HK', 'HN', 'HR',
            'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IQ', 'IR', 'IS', 'IT',
            'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP',
            'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
            'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK',
            'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
            'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP',
            'NR', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PR',
            'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA',
            'SB', 'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO',
            'SR', 'ST', 'SV', 'SY', 'SZ', 'TC', 'TD', 'TG', 'TH', 'TJ', 'TL',
            'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US',
            'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WS', 'YE',
            'ZA', 'ZM'
        ];

        this.countryNameLabel = new Label(this.countryNames[1]);
        this.countryNameLabel.textAlign = 'center';
        this.countryNameLabel.textColor = '#aaa';
        this.addSubview(this.countryNameLabel);
    }

    wasAddedToView() {
        super.wasAddedToView();

        // Flip through the flags over time.

        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.imageView.makeNextCurrent();
            this.countryNameLabel.text = this.countryNames[this.imageView.index];

            if (this.imageView.index === 1) {
                this.addAnimation(new PopIn(this));
            }
        }, 500);
    }

    willBeRemovedFromView() {
        super.willBeRemovedFromView();
        clearInterval(this.interval);
    }

    layoutSubviews() {
        super.layoutSubviews();

        this.imageView.moveToCenterMiddle();

        this.countryNameLabel.width = this.contentWidth;
        this.countryNameLabel.height = 40;
        this.countryNameLabel.moveBelow(this.imageView, 10);
    }
}
