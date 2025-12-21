#!/bin/bash

OUTPUT_FILE="codebase_analysis.txt"
echo "正在分析代码库..." > $OUTPUT_FILE
echo "生成时间: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# ============================================================================
# 1. 目录结构
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "1. 目录结构（2层深度）" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
tree -L 2 -I '__pycache__|*.pyc|.git|venv|env|node_modules' --dirsfirst >> $OUTPUT_FILE 2>&1
echo "" >> $OUTPUT_FILE

# ============================================================================
# 2. 文件统计
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "2. 文件类型统计" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
echo "Python 文件: $(find . -name '*.py' -not -path './__pycache__/*' -not -path './venv/*' | wc -l)" >> $OUTPUT_FILE
echo "Markdown 文档: $(find . -name '*.md' | wc -l)" >> $OUTPUT_FILE
echo "JSON 文件: $(find . -name '*.json' | wc -l)" >> $OUTPUT_FILE
echo "YAML 文件: $(find . -name '*.yml' -o -name '*.yaml' | wc -l)" >> $OUTPUT_FILE
echo "Shell 脚本: $(find . -name '*.sh' | wc -l)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# ============================================================================
# 3. 代码量统计（按目录）
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "3. 各目录代码量" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
for dir in $(find . -maxdepth 1 -type d -not -name ".*" -not -name "__pycache__" | sort); do
    if [ "$dir" != "." ]; then
        py_count=$(find "$dir" -name "*.py" 2>/dev/null | wc -l)
        if [ $py_count -gt 0 ]; then
            lines=$(find "$dir" -name "*.py" -exec cat {} \; 2>/dev/null | wc -l)
            echo "$dir: $lines 行代码, $py_count 个文件" >> $OUTPUT_FILE
        fi
    fi
done
echo "" >> $OUTPUT_FILE

# ============================================================================
# 4. 根目录文件列表
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "4. 根目录所有文件" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
ls -lh *.py *.sh *.txt *.yml *.yaml *.json *.md 2>/dev/null | awk '{print $9, "("$5")"}' >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# ============================================================================
# 5. 检查关键文件
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "5. 关键文件检查" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
for file in requirements.txt docker-compose.yml .env .env.example README.md; do
    if [ -f "$file" ]; then
        echo "✅ $file" >> $OUTPUT_FILE
    else
        echo "❌ $file (缺失)" >> $OUTPUT_FILE
    fi
done
echo "" >> $OUTPUT_FILE

# ============================================================================
# 6. 主要模块列表
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "6. 主要模块目录" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
for dir in api database data_collection authenticity_scoring data_enrichment job_classification pipeline decision_engine apply_engine analysis ai_answer; do
    if [ -d "$dir" ]; then
        file_count=$(find "$dir" -name "*.py" | wc -l)
        echo "✅ $dir/ ($file_count 个Python文件)" >> $OUTPUT_FILE
    else
        echo "❌ $dir/ (不存在)" >> $OUTPUT_FILE
    fi
done
echo "" >> $OUTPUT_FILE

# ============================================================================
# 7. Git 状态
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "7. Git 仓库状态" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
if [ -d ".git" ]; then
    echo "✅ Git 仓库存在" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    echo "未跟踪/修改的文件:" >> $OUTPUT_FILE
    git status --short >> $OUTPUT_FILE 2>&1
else
    echo "❌ 没有 Git 仓库" >> $OUTPUT_FILE
fi
echo "" >> $OUTPUT_FILE

# ============================================================================
# 8. Import 依赖（Top 20）
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "8. 最常用的 Import（Top 20）" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
grep -rh "^from \|^import " --include="*.py" . 2>/dev/null | \
    grep -v "__pycache__" | \
    sed 's/from //' | \
    sed 's/import //' | \
    awk '{print $1}' | \
    sort | uniq -c | sort -rn | head -20 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# ============================================================================
# 9. 最近修改的文件
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "9. 最近修改的 Python 文件（Top 15）" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
find . -name "*.py" -not -path "./__pycache__/*" -type f -exec ls -lt {} + 2>/dev/null | head -15 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# ============================================================================
# 10. 配置和数据文件
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "10. 配置和数据文件" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE
echo "JSON 配置:" >> $OUTPUT_FILE
find . -name "*.json" -not -path "./node_modules/*" -not -path "./__pycache__/*" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "YAML 配置:" >> $OUTPUT_FILE
find . -name "*.yml" -o -name "*.yaml" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "环境文件:" >> $OUTPUT_FILE
find . -name ".env*" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# ============================================================================
# 完成
# ============================================================================
echo "========================================" >> $OUTPUT_FILE
echo "分析完成" >> $OUTPUT_FILE
echo "========================================" >> $OUTPUT_FILE

echo ""
echo "✅ 分析完成！结果保存在: $OUTPUT_FILE"
echo ""
echo "请查看文件内容:"
echo "  cat $OUTPUT_FILE"
echo ""
echo "或者直接发送给 Claude:"
echo "  cat $OUTPUT_FILE"
