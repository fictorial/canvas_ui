import  View from 'canvas_ui/View';
import Label from 'canvas_ui/Label';

export default class NavigationDemoLabelView extends View {
    constructor(text) {
        super();

        this.label = new Label(text);
        this.label.textAlign = 'center';
        this.addSubview(this.label);
    }

    layoutSubviews() {
        this.label.frame = this.bounds;
    }

    wasAddedToNavigationStack() {
        let navBar = this.navigationBar,
            viewNo = this.navigationStack.subviews.length; // 1-based

        let colors = [ '#eee', '#def', '#fed', '#efd', '#88a' ];
        this.label.backgroundColor = colors[viewNo % colors.length];

        navBar.title = `View #${viewNo}`;

        if (viewNo > 1) {
            navBar.leftView.text = 'Back';
            navBar.leftView.on('tap', this.popToPreviousView.bind(this));
        } else {
            navBar.leftView.text = null;
        }

        navBar.rightView.text = 'Push View';
        navBar.rightView.on('tap', this.pushAnotherView.bind(this));
    }

    pushAnotherView() {
        let navStack = this.navigationStack,
            viewNo = navStack.subviews.length + 1;

        navStack.push(new NavigationDemoLabelView(`This is view #${viewNo}`));
    }

    popToPreviousView() {
        let navStack = this.navigationStack;
        if (navStack) {
            navStack.pop();
        }
    }
}
