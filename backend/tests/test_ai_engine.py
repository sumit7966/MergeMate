from app.integrations.ai.parser import AIResponseParser


def test_ai_response_parser_markdown_fence_cleaning():
    raw_markdown = """```json
    {
      "summary": "Identified security defect",
      "verdict": "REQUEST_CHANGES",
      "confidence_score": 0.95,
      "findings": [
        {
          "title": "SQL Injection",
          "description": "Raw string formatting in SQL statement",
          "category": "security",
          "severity": "critical",
          "confidence": 0.98,
          "file_path": "db/query.py",
          "line_start": 25,
          "why_it_matters": "Exposes database to arbitrary query execution",
          "suggested_fix": "Use parameterized queries",
          "source_engine": "ai"
        }
      ]
    }
    ```"""

    valid_lines = {"db/query.py": {25, 26, 27}}
    parsed = AIResponseParser.parse_and_validate(raw_markdown, valid_lines)

    assert parsed["verdict"] == "REQUEST_CHANGES"
    assert parsed["confidence_score"] == 0.95
    assert len(parsed["findings"]) == 1
    finding = parsed["findings"][0]
    assert finding.title == "SQL Injection"
    assert finding.line_start == 25


def test_ai_response_parser_invalid_line_fallback():
    # If LLM hallucinates a line number outside the diff, line_start is nullified
    # so it appears as a file-level finding rather than crashing GitHub inline comment API
    raw = """{
      "summary": "Review",
      "findings": [
        {
          "title": "Unbounded loop",
          "description": "Loop lacks termination clause",
          "category": "bug",
          "severity": "high",
          "confidence": 0.9,
          "file_path": "worker.py",
          "line_start": 999,
          "why_it_matters": "Hang",
          "suggested_fix": "Add break",
          "source_engine": "ai"
        }
      ]
    }"""
    valid_lines = {"worker.py": {10, 11, 12}}
    parsed = AIResponseParser.parse_and_validate(raw, valid_lines)

    assert len(parsed["findings"]) == 1
    assert parsed["findings"][0].line_start is None  # moved to file-level

