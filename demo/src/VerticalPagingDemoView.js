import  _ from 'lodash';
import PagingDemoView from './PagingDemoView';
import Size from 'canvas_ui/Size';

export default class VerticalPagingDemoView extends PagingDemoView {
    constructor() {
        super('Vertical Paging');
    }

    layoutPages() {
        let pageHeight = this.height,
            pageWidth = this.width;

        _.each(this.scrollView.contentView.subviews, (page, index) => {
            page.frame.set(0, pageHeight * index, pageWidth, pageHeight);
        });

        this.scrollView.contentSize = new Size(
            pageWidth,
            pageHeight * this.scrollView.contentView.subviews.length);
    }
}
