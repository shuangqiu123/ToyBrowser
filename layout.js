function layout(element) {
    if (!element.computedStyle) {
        return;
    }
    if (Object.keys(element.computedStyle).length === 0)
        return;
    var elementStyle = getStyle(element);
    // can only handle layout flex type
    if (elementStyle.display && elementStyle.display !== "flex") {
        return;
    }

    let items = element.children.filter(e => e.type === "element");
    items.sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
    });

    var style = elementStyle;

    ["width", "height"].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    });

    if (!style.flexDirection || style.flexDirection === "auto") {
        style.flexDirection = 'row';
    }
    if (!style.alignItems || style.alignItems === "auto") {
        style.alignItems = 'stretch';
    }
    if (!style.justifyContent || style.justifyContent === "auto") {
        style.justifyContent = 'flex-start';
    }
    if (!style.flexWrap || style.flexWrap === "auto") {
        style.flexWrap = 'nowrap';
    }
    if (!style.alignContent || style.alignContent === "auto") {
        style.alignContent = 'stretch';
    }

    var mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;
    if (style.flexDirection === "row") {
        mainSize = "width";
        mainStart = "left";
        mainEnd = "right";

        //属性相减时作用
        mainSign = +1;
        //start from right or left
        mainBase = 0;

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }
    else if (style.flexDirection === "row-reverse") {
        mainSize = "width";
        mainStart = "right";
        mainEnd = "left";

        //属性相减时作用
        mainSign = -1;
        //start from right or left
        mainBase = style.width;

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }
    else if (style.flexDirection === "column") {
        mainSize = "height";
        mainStart = "top";
        mainEnd = "bottom";

        mainSign = +1;
        mainBase = 0;

        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }
    else if (style.flexDirection === "column-reverse") {
        mainSize = "height";
        mainStart = "bottom";
        mainEnd = "top";

        mainSign = -1;
        mainBase = style.height;

        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }

    if (style.flexWrap === "wrap-reverse") {
        let tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;
    }
    else {
        crossBase = 0;
        crossSign = 1;
    }

    //parent element does not set the width/height of the main axis
    var isAutoMainSize = false;
    if (!style[mainSize]) { //auto sizing
        elementStyle[mainSize] = 0;
        for (let i = 0; i < items.length; ++i) {
            var item = items[i];
            var itemStyle = getStyle(item);
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
            }
        }
    }
    isAutoMainSize = true;

    // 元素分行
    var flexLine = [];
    var flexLines = [flexLine];

    //剩余空间
    var mainSpace = elementStyle[mainSize];
    var crossSpace = 0;

    for (let i = 0; i < items.length; ++i) {
        var item = items[i];
        var itemStyle = getStyle(item);

        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        //有flex属性，可伸缩
        if (itemStyle.flex) {
            flexLine.push(item);
        }
        else if (itemStyle.flexWrap === "nowrap" && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize]    ;
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                //the highest element in the line
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        }
        else {
            // child element main size > parent ...
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }
            // cannot be inserted
            if (mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                flexLine = [item];
                flexLines.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            }
            else {
                flexLine.push(item);
            }
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                //the highest element in the line
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
        }
    }

    //calculation of main axis
    flexLine.mainSpace = mainSpace;
    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== (void 0)) ? style[crossSize] : crossSpace;
    }
    else {
        flexLine.crossSpace = crossSpace;
    }
    // mainspace the margin left
    if (mainSpace < 0) {
        // overflow (happens only if container is single line), scale down every item
        // compression by scale
        var scale = style[mainSize] / (style[mainSize] - mainSpace);
        var currentMain = mainBase;
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var itemStyle = getStyle(item);

            // set flex to 0
            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }

            itemStyle[mainSize] *= scale;
            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        }
    }
    else {
        flexLines.forEach(function (items) {
            var mainSpace = items.mainSpace;
            var flexTotal = 0;

            //find all elements with flex
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                var itemStyle = getStyle(item);

                if (itemStyle.flex !== null && (itemStyle.flex !== (void 0))) {
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }

            if (flexTotal > 0) {
                var currentMain = mainBase;
                for (var i = 0; i < items.length; ++i) {
                    var item = items[i];
                    var itemStyle = getStyle(item);
                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }

                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            }
            // justify content
            // since there is no flex items, justify content should work
            else {
                if (style.justifyContent === "flex-start") {
                    var currentMain = mainBase;
                    var step = 0;
                }
                if (style.justifyContent === "flex-end") {
                    var currentMain = mainSpace * mainSign + mainBase;
                    var step = 0;
                }
                if (style.justifyContent === "center") {
                    var currentMain = mainSpace / 2 * mainSign + mainBase;
                    var step = 0;
                }
                if (style.justifyContent === "space-between") {
                    var step = mainSpace / (items.length - 1) * mainSign;
                    var currentMain = mainBase;
                }
                if (style.justifyContent === "space-around") {
                    var step = mainSpace / items.length * mainSign;
                    var currentMain = step / 2 + mainBase;
                }


                for (let i = 0; i < items.length; ++i) {
                    var item = items[i];
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        });
    }

    // calculation of cross axis
    // align-items, align-self
    var crossSpace;
    //check if cross space of parent element has been filled
    if (!style[crossSize]) {
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        for (let i = 0; i < flexLines.length; ++i) {
            elementStyle[crossSize] += flexLines[i].crossSpace;
        }
    }
    else {
        crossSpace = style[crossSize];
        for (let i = 0; i < flexLines.length; ++i) {
            crossSpace -= flexLines[i].crossSpace;
        }
    }

    if (style.flexWrap === "wrap-reverse") {
        crossBase = sytle[crossSize];
    }
    else {
        crossBase = 0;
    }


    var lineSize = style[crossSize] / flexLines.length;
    var step;
    if (style.alignContent === "flex-start") {
        crossBase += 0;
        step = 0;
    }
    if (style.alignContent === "flex-end") {
        crossBase += crossSpace * crossSign;
        step = 0;
    }
    if (style.alignContent === "center") {
        crossBase += crossSpace / 2 * crossSign;
        step = 0;
    }
    if (style.alignContent === "space-between") {
        step = crossSpace / (flexLines.length - 1);
        crossBase += 0;
    }
    if (style.alignContent === "space-around") {
        step = crossSpace / (flexLines.length);
        crossSpace += crossSign * step / 2;
    }
    if (style.alignContent === "stretch") {
        step = 0;
        crossSpace += 0;
    }

    flexLines.forEach(function (items) {
        var lineCrossSize = style.alignContent === "stretch" ?
            items.crossSpace + crossSpace / flexLines.length :
            items.crossSpace;

        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var itemStyle = getStyle(item);

            // the priority of alignSelf is greater than alignItems from parent elements
            var align = itemStyle.alignSelf || style.alignItems;

            if (itemStyle[crossSize] === null || itemStyle[crossSize] === 0) {
                itemStyle[crossSize] = (align === "stretch") ? lineCrossSize : 0;
            }
            if (align === "flex-start") {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if (align === "flex-end") {
                itemStyle[crossEnd] = crossBase + lineCrossSize * crossSign;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }
            if (align === "center") {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if (align === "stretch") {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * (itemStyle[crossSize] !== "null" && itemStyle[crossSize]);
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
            }
        }
        crossBase += crossSign * (lineCrossSize + step);
    });
}

function getStyle(element) {
    if (!element.style) {
        element.style = {};
    }
    for (let prop in element.computedStyle) {
        var p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
        if (element.style[prop].toString().match(/^[0-9\.]$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }

    return element.style;
}

module.exports = layout;