#!/usr/bin/env ruby

require 'csv'
require 'json'

source, destination = ARGV
abort 'Usage: ruby scripts/import-ecdict-toefl.rb SOURCE.csv DESTINATION.json' unless source && destination

def clean_translation(text)
  text.to_s
      .gsub('\\n', '；')
      .gsub(/\[(?:网络|网路|医|计|化|经|法|航|农|生物|地质|物|数|电子|机械)\]\s*/, '')
      .gsub(/(^|；)\s*(?:[a-z]+(?:-[a-z]+)?\.)+\s*/i, '\\1')
      .gsub(/；{2,}/, '；')
      .strip
      .sub(/；\z/, '')
end

words = {}
CSV.foreach(source, headers: true, liberal_parsing: true, encoding: 'bom|utf-8') do |row|
  tags = row['tag'].to_s.split
  next unless tags.include?('toefl')

  english = row['word'].to_s.strip
  next unless english.match?(/\A[a-z][a-z .'-]*\z/i)

  translation = clean_translation(row['translation'])
  next if translation.empty?

  key = english.downcase
  words[key] ||= {
    id: "toefl-#{key.gsub(/[^a-z0-9]+/, '-')}",
    english: english,
    chinese: translation,
    lists: ['TOEFL'],
  }
end

ordered = words.values.sort_by { |word| word[:english].downcase }
File.write(destination, JSON.pretty_generate(ordered) + "\n")
warn "Wrote #{ordered.length} TOEFL words to #{destination}"
