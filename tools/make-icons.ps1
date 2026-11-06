# يرسم أيقونات التطبيق بنفس هندسة الشعار (src/fx/Logo.tsx): شبكة 120×56
Add-Type -AssemblyName System.Drawing
$assets = Join-Path $PSScriptRoot '..\assets'

function RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = [Math]::Min($r * 2, [Math]::Min($w, $h))
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function DrawLogo($g, [float]$cx, [float]$cy, [float]$width, $ink, $dotColor) {
  # شبكة 124×66 مثل src/fx/Logo.tsx
  $k = $width / 124.0
  $ox = $cx - 62 * $k
  $oy = $cy - 33 * $k
  $brush = New-Object System.Drawing.SolidBrush $ink
  $dotBrush = New-Object System.Drawing.SolidBrush $dotColor
  # الخط الأساسي و عمود ل
  $g.FillPath($brush, (RoundRect ($ox + 24 * $k) ($oy + 40 * $k) (92 * $k) (10 * $k) (5 * $k)))
  $g.FillPath($brush, (RoundRect ($ox + 24 * $k) ($oy + 0 * $k) (10 * $k) (50 * $k) (5 * $k)))
  # حلقات ف و ق
  $pen = New-Object System.Drawing.Pen $ink, (9 * $k)
  foreach ($l in 52, 90) {
    $g.DrawPath($pen, (RoundRect ($ox + ($l + 4.5) * $k) ($oy + 24.5 * $k) (17 * $k) (19 * $k) (8.5 * $k)))
  }
  # حوض ل تحت السطر (شكل U)
  $pen.StartCap = 'Flat'; $pen.EndCap = 'Flat'
  $u = New-Object System.Drawing.Drawing2D.GraphicsPath
  $u.AddLine([float]($ox + 8.5 * $k), [float]($oy + 30 * $k), [float]($ox + 8.5 * $k), [float]($oy + 49 * $k))
  $u.AddArc([float]($ox + 8.5 * $k), [float]($oy + 38.5 * $k), [float](21 * $k), [float](21 * $k), 180, -180)
  $u.AddLine([float]($ox + 29.5 * $k), [float]($oy + 49 * $k), [float]($ox + 29.5 * $k), [float]($oy + 40 * $k))
  $g.DrawPath($pen, $u)
  $g.FillEllipse($brush, $ox + 4 * $k, $oy + 26 * $k, 9 * $k, 9 * $k)
  # النقاط
  foreach ($l in 59.5, 89, 104) {
    $g.FillEllipse($dotBrush, $ox + $l * $k, $oy + 2 * $k, 11 * $k, 11 * $k)
  }
}

function NewCanvas([int]$n) {
  $bmp = New-Object System.Drawing.Bitmap $n, $n, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  return @($bmp, $g)
}

function PaintBackground($g, [int]$n) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $n, $n
  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 58, 14, 24)), ([System.Drawing.Color]::FromArgb(255, 8, 10, 16)), 60
  $g.FillRectangle($lg, $rect)
  $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glow.AddEllipse([int](-$n * 0.25), [int](-$n * 0.3), [int]($n * 1.1), [int]($n * 1.0))
  $pg = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow
  $pg.CenterColor = [System.Drawing.Color]::FromArgb(150, 200, 40, 60)
  $pg.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 200, 40, 60))
  $g.FillPath($pg, $glow)
  $glow2 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glow2.AddEllipse([int]($n * 0.35), [int]($n * 0.45), [int]($n * 0.9), [int]($n * 0.8))
  $pg2 = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow2
  $pg2.CenterColor = [System.Drawing.Color]::FromArgb(110, 20, 150, 120)
  $pg2.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 20, 150, 120))
  $g.FillPath($pg2, $glow2)
}

$ink = [System.Drawing.Color]::FromArgb(255, 238, 241, 255)
$dot = [System.Drawing.Color]::FromArgb(255, 255, 107, 120)
$N = 1024

# أيقونة عادية
$c = NewCanvas $N; PaintBackground $c[1] $N; DrawLogo $c[1] ($N / 2) ($N / 2 + 10) 640 $ink $dot
$c[0].Save((Join-Path $assets 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
# خلفية الأيقونة المتكيّفة
$c = NewCanvas $N; PaintBackground $c[1] $N
$c[0].Save((Join-Path $assets 'android-icon-background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
# الواجهة (ضمن المنطقة الآمنة 66٪)
$c = NewCanvas $N; DrawLogo $c[1] ($N / 2) ($N / 2 + 8) 560 $ink $dot
$c[0].Save((Join-Path $assets 'android-icon-foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
# أحادي اللون (لأيقونات أندرويد 13 الملوّنة حسب الخلفية)
$w = [System.Drawing.Color]::White
$c = NewCanvas $N; DrawLogo $c[1] ($N / 2) ($N / 2 + 8) 560 $w $w
$c[0].Save((Join-Path $assets 'android-icon-monochrome.png'), [System.Drawing.Imaging.ImageFormat]::Png)
# شاشة البداية
$c = NewCanvas $N; DrawLogo $c[1] ($N / 2) ($N / 2) 700 $ink $dot
$c[0].Save((Join-Path $assets 'splash-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
'icons written'
