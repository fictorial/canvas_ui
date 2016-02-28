import  _ from 'lodash';

import View from 'canvas_ui/View';
import Label from 'canvas_ui/Label';
import Button from 'canvas_ui/Button';
import * as KeyboardView from 'canvas_ui/KeyboardView';
import ModalView from 'canvas_ui/ModalView';
import {BoldSystemFontOfSize} from 'canvas_ui/fonts';
import {initCanvasUI} from 'canvas_ui/core';

import IntroDemoView from './IntroDemoView';
import BasicViewDemoView from './BasicViewDemoView';
import BorderDemoView from './BorderDemoView';
import CornerRadiusDemoView from './CornerRadiusDemoView';
import ScaleDemoView from './ScaleDemoView';
import AngleDemoView from './AngleDemoView';
import AlphaDemoView from './AlphaDemoView';
import AnimationDemoView from './AnimationDemoView';
import LabelAlignmentDemoView from './LabelAlignmentDemoView';
import LabelStylingDemoView from './LabelStylingDemoView';
import TailTruncationDemoView from './TailTruncationDemoView';
import ButtonDemoView from './ButtonDemoView';
import HitTestDemoView from './HitTestDemoView';
import ScrollableTextDemoView from './ScrollableTextDemoView';
import GridDemoView from './GridDemoView';
import ProgressBarDemoView from './ProgressBarDemoView';
import SliderDemoView from './SliderDemoView';
import SegmentDemoView from './SegmentDemoView';
import TextEditDemoView from './TextEditDemoView';
import RegistrationDemoView from './RegistrationDemoView';
import ImageStretchDemoView from './ImageStretchDemoView';
import ImageScaleAspectFitDemoView from './ImageScaleAspectFitDemoView';
import ImageScaleAspectFillDemoView from './ImageScaleAspectFillDemoView';
import ActivityIndicatorDemoView from './ActivityIndicatorDemoView';
import AlertDemoView from './AlertDemoView';
import NotificationDemoView from './NotificationDemoView';
import CandyButtonDemoView from './CandyButtonDemoView';
import TabDemoView from './TabDemoView';
import NavigationDemoView from './NavigationDemoView';
import DragAndDropBaseDemoView from './DragAndDropBaseDemoView';
import DragAndDropConstraintDemoView from './DragAndDropConstraintDemoView';
import DragAndDropDemoView from './DragAndDropDemoView';
import HorizontalPagingDemoView from './HorizontalPagingDemoView';
import VerticalPagingDemoView from './VerticalPagingDemoView';
import TableViewBasicDemoView from './TableViewBasicDemoView';
import EditableTableViewDemoView from './EditableTableViewDemoView';
import SearchableTableViewDemoView from './SearchableTableViewDemoView';
import TodoDemoView from './TodoDemoView';
import PaintDemoView from './PaintDemoView';
import CountryFlagsDemoView from './CountryFlagsDemoView';
import PackedImageDemoView from './PackedImageDemoView';
import ColorPickerDemoView from './ColorPickerDemoView';

var demoClassList = [
    IntroDemoView,
    BasicViewDemoView,
    BorderDemoView,
    CornerRadiusDemoView,
    ScaleDemoView,
    AngleDemoView,
    AlphaDemoView,
    AnimationDemoView,
    LabelAlignmentDemoView,
    LabelStylingDemoView,
    TailTruncationDemoView,
    ButtonDemoView,
    HitTestDemoView,
    ScrollableTextDemoView,
    GridDemoView,
    ProgressBarDemoView,
    SliderDemoView,
    SegmentDemoView,
    TextEditDemoView,
    RegistrationDemoView,
    ImageStretchDemoView,
    ImageScaleAspectFitDemoView,
    ImageScaleAspectFillDemoView,
    ActivityIndicatorDemoView,
    AlertDemoView,
    NotificationDemoView,
    CandyButtonDemoView,
    TabDemoView,
    NavigationDemoView,
    DragAndDropBaseDemoView,
    DragAndDropConstraintDemoView,
    DragAndDropDemoView,
    HorizontalPagingDemoView,
    VerticalPagingDemoView,
    TableViewBasicDemoView,
    EditableTableViewDemoView,
    SearchableTableViewDemoView,
    TodoDemoView,
    PaintDemoView,
    CountryFlagsDemoView,
    PackedImageDemoView,
    ColorPickerDemoView
];

/**
 * A view that shows a demo contained in a centered view
 * with navigational buttons to show other demos.
 */

class DemoContainerView extends View {
    constructor() {
        super();

        this.commonMargin = 20;

        this.titleLabel = new Label('Demo Title');
        this.titleLabel.id = 'titleLabel';
        this.titleLabel.font = BoldSystemFontOfSize(14);
        this.titleLabel.textAlign = 'center';
        this.titleLabel.insets.left = 10;
        this.titleLabel.insets.right = 10;
        this.addSubview(this.titleLabel);

        this.prevButton = new Button('Previous');
        this.prevButton.id = 'prevButton';
        this.addSubview(this.prevButton);

        this.nextButton = new Button('Next');
        this.nextButton.id = 'nextButton';
        this.addSubview(this.nextButton);

        this.container = new View();
        this.container.id = 'demoContainer';
        this.container.borderWidth = 1;
        this.container.borderColor = '#aaa';
        this.container.backgroundColor = '#eee';
        this.addSubview(this.container);

        this.prevButton.on('tap', () => this.prevDemo());
        this.nextButton.on('tap', () => this.nextDemo());

        if (localStorage) {
            this.demoIndex = parseInt(localStorage.lastDemoIndex, 10) || 0;
        } else {
            this.demoIndex = 0;
        }

        this.demoIndex = this.demoIndex % demoClassList.length;

        this.setDemoFromCurrentState();
    }

    layoutSubviews() {
        this.prevButton
            .sizeToFit()
            .moveInTopLeftCorner({x:this.commonMargin, y:this.commonMargin});

        this.nextButton
            .makeSameSize(this.prevButton)
            .moveInTopRightCorner({x:-this.commonMargin, y:this.commonMargin});

        this.titleLabel.frame.set(
            this.prevButton.right,
            this.prevButton.top,
            this.nextButton.left - this.prevButton.right,
            this.prevButton.height);

        this.container.frame.set(this.commonMargin,
                                 this.titleLabel.bottom + this.commonMargin,
                                 this.width - this.commonMargin * 2,
                                 this.height - this.titleLabel.bottom - this.commonMargin * 2);

        this.currentDemoInstance.frame = this.container.contentFrame;

        _.each(this.subviews, subview => {
            if (subview instanceof ModalView) {
                subview.needsLayout = true;
            }
        });
    }

    prevDemo() {
        if (--this.demoIndex === -1) {
            this.demoIndex = demoClassList.length - 1;
        }

        this.setDemoFromCurrentState();
    }

    nextDemo() {
        this.demoIndex = (this.demoIndex + 1) % demoClassList.length;
        this.setDemoFromCurrentState();
    }

    setDemoFromCurrentState() {
        if (localStorage) {
            localStorage.lastDemoIndex = this.demoIndex;
        }

        if (this.currentDemoInstance) {
            this.currentDemoInstance.removeFromSuperview();

            let kbd = KeyboardView.instance(false);
            if (kbd) {
                kbd.hide();
            }
        }

        this.currentDemoInstance = new demoClassList[this.demoIndex]();
        this.container.addSubview(this.currentDemoInstance);

        this.titleLabel.text = this.currentDemoInstance.title;

        this.currentDemoInstance.needsLayout = true;
        this.needsLayout = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initCanvasUI(DemoContainerView);
    }, 0);
}, false);
