#!/bin/bash

# SSH Terminal Color Test Script
# This script tests all color features in the SSH terminal

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         SSH Terminal Color Test Script                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Basic ANSI colors
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Basic 16 ANSI Colors"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "\x1b[30mBlack (30)\x1b[0m       \x1b[1;30mBright Black (1;30)\x1b[0m"
echo -e "\x1b[31mRed (31)\x1b[0m         \x1b[1;31mBright Red (1;31)\x1b[0m"
echo -e "\x1b[32mGreen (32)\x1b[0m       \x1b[1;32mBright Green (1;32)\x1b[0m"
echo -e "\x1b[33mYellow (33)\x1b[0m      \x1b[1;33mBright Yellow (1;33)\x1b[0m"
echo -e "\x1b[34mBlue (34)\x1b[0m        \x1b[1;34mBright Blue (1;34) - DIRECTORIES!\x1b[0m"
echo -e "\x1b[35mMagenta (35)\x1b[0m     \x1b[1;35mBright Magenta (1;35)\x1b[0m"
echo -e "\x1b[36mCyan (36)\x1b[0m        \x1b[1;36mBright Cyan (1;36) - SYMLINKS!\x1b[0m"
echo -e "\x1b[37mWhite (37)\x1b[0m       \x1b[1;37mBright White (1;37)\x1b[0m"
echo ""

# Test 2: 256 color palette (sample)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: 256 Color Palette (Sample)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Standard colors (16-21):"
for i in {16..21}; do
  printf "\x1b[38;5;${i}m█\x1b[0m"
done
echo ""
echo ""
echo "RGB cube sample (52-87):"
for i in {52..87}; do
  printf "\x1b[38;5;${i}m█\x1b[0m"
  if [ $(((i-51) % 6)) -eq 0 ]; then echo ""; fi
done
echo ""
echo "Grayscale (232-255):"
for i in {232..255}; do
  printf "\x1b[38;5;${i}m█\x1b[0m"
done
echo ""
echo ""

# Test 3: Environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "TERM: $TERM"
echo "COLORTERM: $COLORTERM"
echo "CLICOLOR: $CLICOLOR"
echo "CLICOLOR_FORCE: $CLICOLOR_FORCE"
echo ""
if [ -n "$LS_COLORS" ]; then
  echo "LS_COLORS: ✓ Set (${#LS_COLORS} characters)"
else
  echo "LS_COLORS: ✗ Not set"
fi
echo ""

# Test 4: Create test directory structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: File Type Colors (ls)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Creating test files..."

# Create temp directory
TEST_DIR="/tmp/ssh_color_test_$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create various file types
touch regular_file.txt
touch document.pdf
touch image.jpg
touch audio.mp3
touch video.mp4
touch archive.tar.gz
touch archive.zip
mkdir directory
touch executable.sh && chmod +x executable.sh
ln -s regular_file.txt symlink.txt
mkfifo pipe_file 2>/dev/null || true

echo "Test directory created at: $TEST_DIR"
echo ""
echo "Listing with colors:"
echo ""
ls -lah --color=always
echo ""

# Test 5: Grep colors
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Grep Color Highlighting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Sample log with grep:"
echo ""
cat << 'EOF' | grep --color=always -E 'ERROR|WARNING|SUCCESS|$'
[2024-01-01 10:00:00] INFO: Application started
[2024-01-01 10:00:01] SUCCESS: Connection established
[2024-01-01 10:00:02] WARNING: High memory usage detected
[2024-01-01 10:00:03] ERROR: Failed to connect to database
[2024-01-01 10:00:04] INFO: Retrying connection...
[2024-01-01 10:00:05] SUCCESS: Database connection restored
EOF
echo ""

# Test 6: IP addresses and numbers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: IP Addresses and Network Info"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Sample network output:"
echo ""
cat << 'EOF'
Interface: eth0
  IP Address: 192.168.1.100
  Netmask: 255.255.255.0
  Gateway: 192.168.1.1
  MAC Address: 00:1A:2B:3C:4D:5E
  
DNS Servers:
  Primary: 8.8.8.8
  Secondary: 8.8.4.4
  
Port Status:
  22/tcp   open   ssh
  80/tcp   open   http
  443/tcp  open   https
  3306/tcp closed mysql
EOF
echo ""

# Test 7: Permissions and ownership
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 7: File Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
ls -la "$TEST_DIR" --color=always | head -10
echo ""

# Test 8: Colored diff
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 8: Diff Colors"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Sample diff output:"
echo ""
cat << 'EOF'
--- old_file.txt
+++ new_file.txt
@@ -1,5 +1,5 @@
 Line 1: unchanged
-Line 2: old content
+Line 2: new content
 Line 3: unchanged
-Line 4: removed
+Line 4: modified
 Line 5: unchanged
EOF
echo ""

# Test 9: Tree structure (if available)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 9: Directory Tree"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if command -v tree &> /dev/null; then
  tree -C "$TEST_DIR"
else
  echo "tree command not available, showing ls -R instead:"
  ls -R --color=always "$TEST_DIR"
fi
echo ""

# Test 10: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ Basic ANSI colors tested"
echo "✓ 256 color palette tested"
echo "✓ Environment variables checked"
echo "✓ File type colors tested"
echo "✓ Grep highlighting tested"
echo "✓ Network info display tested"
echo "✓ File permissions tested"
echo "✓ Diff colors tested"
echo "✓ Directory tree tested"
echo ""
echo "Expected colors:"
echo "  🔵 Directories should be BLUE (bright blue)"
echo "  🟢 Executables should be GREEN (bright green)"
echo "  🔷 Symlinks should be CYAN (bright cyan)"
echo "  🔴 Archives should be RED (bright red)"
echo "  🟣 Images should be MAGENTA (bright magenta)"
echo ""
echo "If you see these colors correctly, your terminal is configured properly!"
echo ""

# Cleanup
echo "Cleaning up test directory..."
rm -rf "$TEST_DIR"
echo "Done!"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Test Complete!                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
