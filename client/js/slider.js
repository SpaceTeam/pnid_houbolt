var rangeSlider = function(sliderRow)
{
    var slider = sliderRow.find('.range-slider'),
        range = sliderRow.find('.range-slider__range'),
        value = sliderRow.find('.range-slider__value');

    slider.each(function()
    {
        value.each(function()
        {
            var value = $(this).parent().find('.range-slider__range').attr('value');
            $(this).html(value);
        });

        range.on('input', function()
        {
            $(this).parent().find('.range-slider__value').html(this.value);
        });
    });
};

function setSliderFeedback(slider, feedbackValue)
{
    let percent = feedbackValue / slider.attr("max") * 100;
    slider.css("background", `-webkit-gradient(linear, left top, right top, color-stop(${percent}%, var(--accent-disabled)), color-stop(${percent}%, var(--background-tertiary)))`);
}

function setSliderValue(slider, value)
{
    console.log("slider", slider.first());
    slider[0].value = value; //I dislike having this hardcoded
    let valueOut = slider.siblings("span.range-slider__value");
    valueOut.text(Math.round(value));
}

var minInput = $("#fuelServoMin");
var maxInput = $("#fuelServoMax");
var minMaxTester = $("#fuelServo");
minInput.on("change", function (event) {
    minMaxTester.attr("min", minInput.val());
    console.log(Math.min(Math.max(minMaxTester.val(), minInput.val()), maxInput.val()));
    minMaxTester.val(Math.min(Math.max(minMaxTester.val(), minInput.val()), maxInput.val()));
    minMaxTester.trigger('input');
});
maxInput.on("change", function (event) {
    minMaxTester.attr("max", maxInput.val());
    console.log(Math.min(Math.max(minMaxTester.val(), minInput.val()), maxInput.val()));
    minMaxTester.val(Math.min(Math.max(minMaxTester.val(), minInput.val()), maxInput.val()));
    minMaxTester.trigger('input');
});

// $("input[type='number']:not(.spinner-disable):not(.post-initialized-spinner)").inputSpinner();
