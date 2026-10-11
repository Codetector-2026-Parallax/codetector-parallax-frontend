from datetime import datetime, timezone
import re
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from app.api.deps import get_current_team
from app.config import settings
from app.core.database import sandbox_engine
from app.models.team import Team
from app.schemas.game import QueryRequest, QueryResult

router = APIRouter(prefix="/sandbox", tags=["Sandbox"])

# Regex phát hiện các lệnh nguy hiểm hoặc cố tình can thiệp hệ thống
DANGEROUS_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|COPY|CREATE|VACUUM|EXECUTE|CALL|DO|REINDEX|LOCK)\b",
    re.IGNORECASE,
)


@router.post("/query", response_model=QueryResult)
async def run_query(
    req: QueryRequest,
    team: Team = Depends(get_current_team),
):
    """
    Thực thi câu lệnh SQL điều tra trong môi trường Sandbox an toàn.
    Chỉ cho phép đọc (SELECT) trên schema 'challenge'.
    """
    raw_sql = req.sql.strip()

    # 1. Kiểm tra độ rỗng
    if not raw_sql:
        return QueryResult(
            success=False,
            error="Câu lệnh SQL không được để trống.",
            execution_time_ms=0.0,
        )

    # 2. Ngăn chặn Multi-statement bằng dấu chấm phẩy
    # Chỉ cho phép tối đa 1 dấu chấm phẩy ở cuối câu lệnh
    cleaned_sql = raw_sql.rstrip(";\t\n\r ")
    if ";" in cleaned_sql:
        return QueryResult(
            success=False,
            error="Bảo mật: Không được phép thực thi nhiều câu lệnh cùng lúc (chứa dấu ';').",
            execution_time_ms=0.0,
        )

    # 3. Kiểm tra từ khóa ghi/sửa dữ liệu
    if DANGEROUS_KEYWORDS.search(cleaned_sql):
        return QueryResult(
            success=False,
            error="Từ chối truy cập: Sandbox chỉ hỗ trợ các câu lệnh truy vấn đọc dữ liệu (SELECT).",
            execution_time_ms=0.0,
        )

    # 4. Kiểm tra câu lệnh có bắt đầu bằng SELECT hoặc WITH (CTE)
    upper_trimmed = cleaned_sql.lstrip().upper()
    if not (upper_trimmed.startswith("SELECT") or upper_trimmed.startswith("WITH") or upper_trimmed.startswith("EXPLAIN")):
        return QueryResult(
            success=False,
            error="Câu lệnh không hợp lệ: Chỉ chấp nhận truy vấn bắt đầu bằng SELECT hoặc WITH.",
            execution_time_ms=0.0,
        )

    # 5. Đảm bảo có giới hạn LIMIT (Tối đa 50 dòng để chống tràn bộ nhớ client)
    if "LIMIT" not in upper_trimmed:
        final_sql = f"{cleaned_sql} LIMIT {settings.SANDBOX_ROW_LIMIT}"
    else:
        final_sql = cleaned_sql

    start_time = time.perf_counter()

    try:
        async with sandbox_engine.connect() as conn:
            # Thiết lập transaction read-only và timeout 3s cho kết nối
            await conn.execute(text(f"SET statement_timeout = '{settings.SANDBOX_STATEMENT_TIMEOUT_MS}ms'"))
            await conn.execute(text("SET search_path = challenge"))

            result = await conn.execute(text(final_sql))
            execution_time = (time.perf_counter() - start_time) * 1000

            if result.returns_rows:
                columns = list(result.keys())
                raw_rows = result.fetchmany(settings.SANDBOX_ROW_LIMIT)
                # Chuyển đổi các kiểu dữ liệu phức tạp thành string/int để trả JSON an toàn
                serialized_rows = [
                    [
                        item.isoformat() if hasattr(item, "isoformat") else str(item) if item is not None else None
                        for item in row
                    ]
                    for row in raw_rows
                ]
                return QueryResult(
                    success=True,
                    columns=columns,
                    rows=serialized_rows,
                    row_count=len(serialized_rows),
                    execution_time_ms=round(execution_time, 2),
                )
            else:
                return QueryResult(
                    success=True,
                    columns=[],
                    rows=[],
                    row_count=0,
                    execution_time_ms=round(execution_time, 2),
                )

    except Exception as exc:
        execution_time = (time.perf_counter() - start_time) * 1000
        err_msg = str(exc)
        # Lọc bỏ thông tin nhạy cảm của server trong traceback nếu có
        clean_err = err_msg.split("\n")[0]
        return QueryResult(
            success=False,
            columns=[],
            rows=[],
            row_count=0,
            execution_time_ms=round(execution_time, 2),
            error=f"Lỗi cú pháp SQL: {clean_err}",
        )
