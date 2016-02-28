import  _ from 'lodash';
import PagingDemoView from './PagingDemoView';
import Size from 'canvas_ui/Size';

export default class HorizontalPagingDemoView extends PagingDemoView {
    constructor() {
        super('Horizontal Paging');
    }

    layoutPages() {
        let pageHeight = this.height,
            pageWidth = this.width;

        _.each(this.scrollView.contentView.subviews, (page, index) => {
            page.frame.set(pageWidth * index, 0, pageWidth, pageHeight);
        });

        this.scrollView.contentSize = new Size(
            pageWidth * this.scrollView.contentView.subviews.length,
            pageHeight);
    }
}
