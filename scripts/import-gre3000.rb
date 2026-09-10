#!/usr/bin/env ruby

require 'csv'
require 'json'

source, destination = ARGV
abort 'Usage: ruby scripts/import-gre3000.rb SOURCE.csv DESTINATION.json' unless source && destination

def chinese_translation(text)
  text.to_s
      .scan(/[\p{Han}][\p{Han}，、；：！？（）《》“”·\s]*/)
      .map { |part| part.gsub(/\s+/, '').strip }
      .reject(&:empty?)
      .join('；')
end

words = {}
CSV.foreach(source, headers: true, liberal_parsing: true) do |row|
  english = row[0].to_s.strip
  next unless english.match?(/\A[a-z][a-z .'-]*\z/i)

  translation = chinese_translation(row[2])
  next if translation.empty?

  key = english.downcase
  words[key] ||= {
    id: "gre-#{key.gsub(/[^a-z0-9]+/, '-')}",
    english: english,
    chinese: translation,
    lists: ['GRE'],
  }
end

ordered = words.values.sort_by { |word| word[:english].downcase }
File.write(destination, JSON.pretty_generate(ordered) + "\n")
warn "Wrote #{ordered.length} GRE words to #{destination}"
