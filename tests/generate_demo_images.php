<?php
// Generates clean placeholder civic images using PHP GD
$images = [
    'demo_pothole.jpg' => ['title' => 'Pothole Defect', 'desc' => 'Severe asphalt depression on Industrial Link Road', 'bg' => [45, 52, 60], 'accent' => [239, 68, 68]],
    'demo_streetlight.jpg' => ['title' => 'Streetlight Outage', 'desc' => 'Municipal lamp post #45 dark after sundown', 'bg' => [15, 23, 42], 'accent' => [245, 158, 11]],
    'demo_waterlogging.jpg' => ['title' => 'Monsoon Waterlogging', 'desc' => 'Submerged road shoulder near Metro Pillar 142', 'bg' => [20, 45, 75], 'accent' => [6, 182, 212]],
    'demo_garbage.jpg' => ['title' => 'Solid Waste Accumulation', 'desc' => 'Sidewalk blocked near Market Square container', 'bg' => [40, 50, 40], 'accent' => [234, 179, 8]],
    'demo_footpath.jpg' => ['title' => 'Damaged Pedestrian Walkway', 'desc' => 'Broken paver blocks and trip hazard', 'bg' => [55, 55, 60], 'accent' => [249, 115, 22]],
    'demo_drainage.jpg' => ['title' => 'Missing Chamber Lid', 'desc' => 'Critical open stormwater hazard on Canal Side', 'bg' => [60, 30, 30], 'accent' => [225, 29, 72]],
    'demo_repair_streetlight.jpg' => ['title' => 'Verified Streetlight Repair', 'desc' => 'LED Luminaire Replaced & Photocell Operational', 'bg' => [16, 50, 35], 'accent' => [16, 185, 129]],
    'demo_repair_pothole.jpg' => ['title' => 'Asphalt Patch Repair Verified', 'desc' => 'Compacted Bituminous Mix Levelled & Sealed', 'bg' => [25, 45, 35], 'accent' => [16, 185, 129]]
];

$assetsDir = __DIR__ . '/../assets';
if (!is_dir($assetsDir)) {
    mkdir($assetsDir, 0755, true);
}

foreach ($images as $filename => $info) {
    $w = 640;
    $h = 420;
    $im = imagecreatetruecolor($w, $h);

    $bg = imagecolorallocate($im, $info['bg'][0], $info['bg'][1], $info['bg'][2]);
    $cardBg = imagecolorallocate($im, $info['bg'][0] + 15, $info['bg'][1] + 15, $info['bg'][2] + 20);
    $accent = imagecolorallocate($im, $info['accent'][0], $info['accent'][1], $info['accent'][2]);
    $white = imagecolorallocate($im, 245, 247, 250);
    $gray = imagecolorallocate($im, 156, 163, 175);
    $gridCol = imagecolorallocate($im, $info['bg'][0] + 8, $info['bg'][1] + 8, $info['bg'][2] + 10);

    imagefill($im, 0, 0, $bg);

    // Subtle technical grid
    for ($x = 0; $x < $w; $x += 40) {
        imageline($im, $x, 0, $x, $h, $gridCol);
    }
    for ($y = 0; $y < $h; $y += 40) {
        imageline($im, 0, $y, $w, $y, $gridCol);
    }

    // Modern card panel
    imagefilledrectangle($im, 30, 30, $w - 30, $h - 30, $cardBg);
    imagerectangle($im, 30, 30, $w - 30, $h - 30, $accent);

    // Header badge
    imagefilledrectangle($im, 50, 50, 220, 80, $accent);
    imagestring($im, 4, 60, 58, "SAFECITY EVIDENCE", $white);

    // Title and metadata
    imagestring($im, 5, 50, 110, $info['title'], $white);
    imagestring($im, 4, 50, 140, $info['desc'], $gray);

    // Coordinate watermark
    imagestring($im, 3, 50, 330, "GPS GEOTAG: 12.9738 N, 77.6055 E | TIME: " . date('Y-m-d H:i:s'), $gray);
    imagestring($im, 3, 50, 350, "STATUS: OFFICIAL CIVIC VERIFICATION RECORD", $accent);

    imagejpeg($im, "$assetsDir/$filename", 90);
    imagedestroy($im);
}
echo "Generated " . count($images) . " civic asset photos successfully.\n";

