from app.engines.diff_parser import DiffParser


def test_diff_parser_hunk_and_line_mapping():
    sample_patch = (
        "@@ -10,4 +10,6 @@\n"
        " def old_code():\n"
        "-    return 1\n"
        "+    x = 10\n"
        "+    return x + 1\n"
        "     print('done')\n"
    )

    diff = DiffParser.parse_patch(sample_patch, "math_utils.py")
    assert diff.filename == "math_utils.py"
    assert diff.additions == 2
    assert diff.deletions == 1

    # Lines 11 and 12 should be marked valid added lines
    assert DiffParser.is_line_in_diff(diff, 11) is True
    assert DiffParser.is_line_in_diff(diff, 12) is True
    assert DiffParser.is_line_in_diff(diff, 99) is False

    context = DiffParser.extract_changed_context(diff)
    assert "+ L11:     x = 10" in context
    assert "+ L12:     return x + 1" in context

