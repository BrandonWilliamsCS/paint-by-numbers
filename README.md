# Target Workflow

## Create/Edit mode

1. Upload .bmp file
    1. future ideas:
        1. allow other file types
        1. be smart about similar colors
1. Process file to identify regions of the same color, boundries between those regions
1. Display image with generated outlines
    1. Preserve black regions; 
    1. Can edit color, transparency, and thickness of lines
1. Add custom lines via two-point bezier curve
1. Save raw and processed image, plus current settings
    1. can resume editing by importing saved file

## Preview/Reference mode

1. load output of create/edit mode
1. Present grayscale picture with numbers in place
1. Zoom, pan, etc. over picture
1. Hover over region:
    1. pallete color emphasised (including number)
    1. shape somehow emphasised (e.g., pop-out or dim others)
1. Can edit transparency and thickness of lines?!?

## Print/generate mode

export to arbitrarily high dpi bitmap, which can be converted elsewhere or printed.