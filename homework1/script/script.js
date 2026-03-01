$(function () {
  const $title = $("#mainTitle");
  const $photo = $("#profilePhoto");
  const $btn = $("#animateBtn");

  const originalFontSize = $title.css("font-size");
  const originalColor = $title.css("color");

  $btn.on("click", function () {

    $btn.prop("disabled", true);

 
    $photo.css("border", "4px solid #000");


    $title.css("color", "crimson");
    setTimeout(function () {
      $title.css("color", originalColor);
    }, 900);

    const currentPx = parseFloat(originalFontSize); // e.g., "32px" -> 32
    const grownPx = (currentPx + 18).toString() + "px";

    $title.animate({ fontSize: grownPx }, 600)
          .animate({ fontSize: originalFontSize }, 600, function () {
            $btn.prop("disabled", false);
          });
  });
});
