import pandas as pd
from rapidfuzz.distance import Levenshtein
import string

def _normalize_text(text):
    return "".join(filter(lambda x: x in string.ascii_letters + string.digits, str(text))).lower()

def _clean_text(text, ignore_space=True, is_filter=True):
    text = str(text) if pd.notna(text) else ""
    if ignore_space:
        text = text.replace(" ", "")
    if is_filter:
        text = _normalize_text(text)
    return text

# Load CSV
csv_path = "predicted_plate_numbers_new_detrec.csv"
df = pd.read_csv(csv_path, dtype=str)

# Xử lý NaN
df["pred_line1"].fillna("", inplace=True)
df["pred_line2"].fillna("", inplace=True)

# Bỏ dòng không hợp lệ
df["is_valid"] = ~(df["pred_line1"].isna() & df["pred_line2"].isna())
df = df[df["is_valid"]].copy()

# Chuẩn hóa text
df["gt_line1_norm"] = df["gt_line1"].apply(_clean_text)
df["gt_line2_norm"] = df["gt_line2"].apply(_clean_text)
df["pred_line1_norm"] = df["pred_line1"].apply(_clean_text)
df["pred_line2_norm"] = df["pred_line2"].apply(_clean_text)

# So sánh đúng/sai
df["correct_line1"] = df["gt_line1_norm"] == df["pred_line1_norm"]
df["correct_line2"] = df["gt_line2_norm"] == df["pred_line2_norm"]
df["correct_both"] = df["correct_line1"] & df["correct_line2"]

# Accuracy by Hoan: đúng cả 2 dòng
accuracy_by_hoan = df["correct_both"].sum() / len(df)

# Accuracy by PP (dòng)
valid_lines = df["gt_line1"].notna().sum() + df["gt_line2"].notna().sum()
total_correct = df["correct_line1"].sum() + df["correct_line2"].sum()
accuracy_by_pp = total_correct / valid_lines if valid_lines > 0 else 0.0

# Tính Normalized Edit Distance (CER)
df["edit_line1"] = df.apply(lambda row: Levenshtein.normalized_distance(row["pred_line1_norm"], row["gt_line1_norm"]) if row["gt_line1_norm"] or row["pred_line1_norm"] else 0, axis=1)
df["edit_line2"] = df.apply(lambda row: Levenshtein.normalized_distance(row["pred_line2_norm"], row["gt_line2_norm"]) if row["gt_line2_norm"] or row["pred_line2_norm"] else 0, axis=1)

total_edit_distance = df["edit_line1"].sum() + df["edit_line2"].sum()
average_cer = total_edit_distance / valid_lines if valid_lines > 0 else 0.0

# ✅ In kết quả
print("📊 ĐÁNH GIÁ HIỆU SUẤT")
print(f"🔹 Accuracy by Hoan (đúng cả 2 dòng): {accuracy_by_hoan:.4f} ({accuracy_by_hoan*100:.2f}%)")
print(f"🔹 Accuracy by PP   (trên từng dòng): {accuracy_by_pp:.4f} ({accuracy_by_pp*100:.2f}%)")
print(f"🔹 Average CER (Normalized Distance): {average_cer:.4f}")

# (Tuỳ chọn) Hiển thị một vài dòng sai
incorrect_df = df[~df["correct_both"]]
print(f"\n❌ Số mẫu sai (ít nhất 1 dòng): {len(incorrect_df)}")
print(incorrect_df[["gt_line1", "pred_line1", "gt_line2", "pred_line2"]].head(5))
