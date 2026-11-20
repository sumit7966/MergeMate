import re
from typing import List, Dict, Optional, Tuple, Set


class DiffLine:
    def __init__(self, line_type: str, content: str, old_lineno: Optional[int], new_lineno: Optional[int]):
        self.line_type = line_type  # 'add', 'delete', 'context', 'hunk_header'
        self.content = content
        self.old_lineno = old_lineno
        self.new_lineno = new_lineno

    def to_dict(self) -> Dict:
        return {
            "type": self.line_type,
            "content": self.content,
            "old_lineno": self.old_lineno,
            "new_lineno": self.new_lineno
        }


class FileDiff:
    def __init__(self, filename: str, status: str = "modified"):
        self.filename = filename
        self.status = status
        self.lines: List[DiffLine] = []
        self.valid_new_lines: Set[int] = set()
        self.additions: int = 0
        self.deletions: int = 0

    def add_line(self, line: DiffLine):
        self.lines.append(line)
        if line.line_type == "add" and line.new_lineno is not None:
            self.valid_new_lines.add(line.new_lineno)
            self.additions += 1
        elif line.line_type == "delete":
            self.deletions += 1


class DiffParser:
    """
    Parses unified git diffs into structured file representations,
    identifying exact line ranges, additions, and deletions for inline placement.
    """
    HUNK_HEADER_RE = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")

    @classmethod
    def parse_patch(cls, patch: str, filename: str) -> FileDiff:
        file_diff = FileDiff(filename=filename)
        if not patch:
            return file_diff

        old_lineno = 0
        new_lineno = 0

        for line in patch.splitlines():
            if line.startswith("@@"):
                match = cls.HUNK_HEADER_RE.match(line)
                if match:
                    old_start = int(match.group(1))
                    new_start = int(match.group(3))
                    old_lineno = old_start
                    new_lineno = new_start
                    file_diff.add_line(DiffLine("hunk_header", line, None, None))
                continue

            if line.startswith("+") and not line.startswith("+++"):
                file_diff.add_line(DiffLine("add", line[1:], None, new_lineno))
                new_lineno += 1
            elif line.startswith("-") and not line.startswith("---"):
                file_diff.add_line(DiffLine("delete", line[1:], old_lineno, None))
                old_lineno += 1
            else:
                # Context line or leading whitespace
                content = line[1:] if line.startswith(" ") else line
                file_diff.add_line(DiffLine("context", content, old_lineno, new_lineno))
                old_lineno += 1
                new_lineno += 1

        return file_diff

    @classmethod
    def is_line_in_diff(cls, file_diff: FileDiff, line_number: int) -> bool:
        """Verify if a line number is part of the added/modified code in this diff"""
        return line_number in file_diff.valid_new_lines

    @classmethod
    def extract_changed_context(cls, file_diff: FileDiff, max_context_lines: int = 500) -> str:
        """
        Produce a safe, bounded code snippet representation for AI review,
        explicitly prefixing lines with line numbers for accurate model reference.
        """
        output = []
        for line in file_diff.lines[:max_context_lines]:
            if line.line_type == "hunk_header":
                output.append(line.content)
            elif line.line_type == "add":
                output.append(f"+ L{line.new_lineno}: {line.content}")
            elif line.line_type == "delete":
                output.append(f"- L{line.old_lineno}: {line.content}")
            else:
                output.append(f"  L{line.new_lineno}: {line.content}")
        return "\n".join(output)

